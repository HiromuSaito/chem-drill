import { Id } from "../../domain/shared/id.ts";
import {
  DrillSession,
  type DrillAnswer,
  type DrillSessionId,
} from "../../domain/drill-session/entity/drill-session.ts";
import type { DrillSessionRepository } from "../../domain/drill-session/repository/drill-session-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";
import type {
  AddExperience,
  RankUpEventDto,
} from "../user-experience/add-experience.ts";

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
  }): Promise<{
    sessionId: string;
    earnedExp: number;
    rankUps: RankUpEventDto[];
  }> {
    return this.uow.run(async () => {
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

      const expAmount = 10 + session.correctCount * 2;
      const rankUps = await this.addExperience.run({
        userId: params.userId,
        action: "drill_complete",
        referenceId: session.id,
        amount: expAmount,
      });

      return { sessionId: session.id, earnedExp: expAmount, rankUps };
    });
  }
}
