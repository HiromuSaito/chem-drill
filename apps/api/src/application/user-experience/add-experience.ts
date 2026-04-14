import type { UnitOfWork } from "../unit-of-work.ts";
import { UserExperience } from "../../domain/user-experience/entity/user-experience.ts";
import type {
  UserExperienceRepository,
  ExperienceAction,
} from "../../domain/user-experience/repository/user-experience-repository.ts";
import { getRankInfo } from "../../domain/user-experience/rank-definitions.ts";

export type AddExperienceInput = {
  userId: string;
  action: ExperienceAction;
  referenceId: string;
  amount: number;
};

export type RankUpEventDto = {
  id: string;
  userId: string;
  previousRank: number;
  newRank: number;
  substance: string;
  category: string;
  createdAt: string;
};

export class AddExperience {
  constructor(
    private uow: UnitOfWork,
    private userExperienceRepository: UserExperienceRepository,
  ) {}

  /** トランザクション外から呼ぶ場合 */
  async execute(input: AddExperienceInput): Promise<RankUpEventDto[]> {
    return this.uow.run(async () => {
      return this.run(input);
    });
  }

  /** 既存トランザクション内から呼ぶ場合 */
  async run(input: AddExperienceInput): Promise<RankUpEventDto[]> {
    // 二重付与チェック（ログ挿入がfalseなら既に付与済み）
    const logged = await this.userExperienceRepository.saveExperienceLog({
      userId: input.userId,
      action: input.action,
      amount: input.amount,
      referenceId: input.referenceId,
    });
    if (!logged) return [];

    // 現在の経験値を取得（なければ初期状態を作成）
    const current =
      (await this.userExperienceRepository.findByUserId(input.userId)) ??
      UserExperience.create(input.userId);

    // 経験値加算 & ランクアップ判定
    const { userExperience: updated, rankUps } = current.addExp(input.amount);

    // 保存
    await this.userExperienceRepository.save(updated);

    // ランクアップイベント保存
    if (rankUps.length > 0) {
      const saved = await this.userExperienceRepository.saveRankUpEvents(
        rankUps.map((r) => ({
          userId: input.userId,
          previousRank: r.previousRank,
          newRank: r.newRank,
        })),
      );
      return saved.map((e) => {
        const def = getRankInfo(e.newRank);
        return {
          id: e.id,
          userId: e.userId,
          previousRank: e.previousRank,
          newRank: e.newRank,
          substance: def.substance,
          category: def.category,
          createdAt: e.createdAt.toISOString(),
        };
      });
    }

    return [];
  }
}
