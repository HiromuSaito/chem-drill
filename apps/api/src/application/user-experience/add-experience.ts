import type { UnitOfWork } from "../unit-of-work.ts";
import { UserExperience } from "../../domain/user-experience/entity/user-experience.ts";
import type {
  UserExperienceRepository,
  ExperienceAction,
} from "../../domain/user-experience/repository/user-experience-repository.ts";

export type AddExperienceInput = {
  userId: string;
  action: ExperienceAction;
  referenceId: string;
  amount: number;
};

export class AddExperience {
  constructor(
    private uow: UnitOfWork,
    private userExperienceRepository: UserExperienceRepository,
  ) {}

  async execute(input: AddExperienceInput): Promise<void> {
    await this.uow.run(async () => {
      // 二重付与チェック（ログ挿入がfalseなら既に付与済み）
      const logged = await this.userExperienceRepository.saveExperienceLog({
        userId: input.userId,
        action: input.action,
        amount: input.amount,
        referenceId: input.referenceId,
      });
      if (!logged) return;

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
        await this.userExperienceRepository.saveRankUpEvents(
          rankUps.map((r) => ({
            userId: input.userId,
            previousRank: r.previousRank,
            newRank: r.newRank,
          })),
        );
      }
    });
  }
}
