import { Id } from "../../domain/shared/id.ts";
import {
  DrillSession,
  type DrillAnswer,
  type DrillSessionId,
} from "../../domain/drill-session/entity/drill-session.ts";
import type { DrillSessionRepository } from "../../domain/drill-session/repository/drill-session-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";
import type { AddExperience } from "../user-experience/add-experience.ts";

export class SaveDrillSession {
  constructor(
    private uow: UnitOfWork,
    private drillSessionRepository: DrillSessionRepository,
    private addExperience: AddExperience,
  ) {}

  async execute(params: {
    userId: string;
    categoryId: string | null;
    answers: DrillAnswer[];
    startedAt: string;
  }): Promise<{ sessionId: string }> {
    const { sessionId, correctCount } = await this.uow.run(async () => {
      const sessionId = Id.random<DrillSession>() as DrillSessionId;
      const session = DrillSession.create({
        id: sessionId,
        userId: params.userId,
        categoryId: params.categoryId,
        answers: params.answers,
        startedAt: new Date(params.startedAt),
        completedAt: new Date(),
      });
      await this.drillSessionRepository.save(session);
      return { sessionId: session.id, correctCount: session.correctCount };
    });

    await this.addExperience.execute({
      userId: params.userId,
      action: "drill_complete",
      referenceId: sessionId,
      amount: 10 + correctCount * 2,
    });

    return { sessionId };
  }
}
