import type { DomainEvent } from "../../domain/shared/domain-event.ts";
import type { EventHandler } from "../../domain/shared/event-handler.ts";
import type { EventPublisher } from "../../domain/shared/event-publisher.ts";
import type { Logger } from "../../lib/logger.ts";

/**
 * 同一プロセス内でイベントハンドラを同期的に呼び出す EventPublisher 実装。
 *
 * トレードオフ:
 * - 集約間のトランザクション分離は実現できるが、publish 元のトランザクションが
 *   COMMIT された後にハンドラ側が失敗した場合の自動リトライ機構はない。
 * - 本来は SQS 等のキューを介して結果整合性を担保するのが堅牢だが、
 *   現時点ではインフラの複雑化（キュー + コンシューマ Lambda）に見合う規模ではないため、
 *   インメモリ実装 + 冪等性チェック（questionCreated フラグ）で割り切っている。
 * - 将来キューが必要になった場合は EventPublisher インターフェースの実装を
 *   差し替えるだけで対応できる。
 */
export class InMemoryEventPublisher implements EventPublisher {
  private handlers: EventHandler<DomainEvent<string, unknown>>[] = [];

  constructor(private readonly logger: Logger) {}

  register<E extends DomainEvent<string, unknown>>(
    handler: EventHandler<E>,
  ): void {
    this.handlers.push(handler as EventHandler<DomainEvent<string, unknown>>);
  }

  async publish(event: DomainEvent<string, unknown>): Promise<void> {
    const matched = this.handlers.filter((h) => h.eventType === event.type);

    for (const handler of matched) {
      try {
        await handler.handle(event);
      } catch (error) {
        this.logger.error("イベントハンドラでエラーが発生しました", {
          eventType: event.type,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  }
}
