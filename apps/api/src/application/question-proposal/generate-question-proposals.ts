import type { Category } from "../../domain/category/entity/category.ts";
import { Id } from "../../domain/shared/id.ts";
import { CorrectIndexes } from "../../domain/shared/value-object/correct-indexes.ts";
import { Difficulty } from "../../domain/shared/value-object/difficulty.ts";
import { Explanation } from "../../domain/shared/value-object/explanation.ts";
import { QuestionText } from "../../domain/shared/value-object/question-text.ts";
import { QuestionProposal } from "../../domain/question-proposal/entity/question-proposal.ts";
import type { QuestionProposalRepository } from "../../domain/question-proposal/repository/question-proposal-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";
import type { QuestionGenerationService } from "./question-generation-service.ts";

const QUESTION_COUNT = 10;

export class GenerateQuestionProposals {
  constructor(
    private uow: UnitOfWork,
    private questionGenerationService: QuestionGenerationService,
    private questionProposalRepository: QuestionProposalRepository,
  ) {}

  async execute(input: {
    url: string;
    categoryId: string;
  }): Promise<QuestionProposal[]> {
    const categoryId = Id.of<Category>(input.categoryId);

    // Gemini API 呼出
    const questions = await this.questionGenerationService.generate(
      input.url,
      QUESTION_COUNT,
    );

    // 各問題で QuestionProposal を作成して保存
    const proposals: QuestionProposal[] = [];

    for (const q of questions) {
      const proposal = await this.uow.run(async () => {
        const { proposal, event } = QuestionProposal.create({
          questionText: QuestionText.create(q.questionText),
          difficulty: Difficulty.create(q.difficulty),
          choices: q.choices,
          correctIndexes: CorrectIndexes.create(q.correctIndexes),
          explanation: Explanation.create(q.explanation),
          categoryId,
        });

        await this.questionProposalRepository.save(proposal, event);
        return proposal;
      });

      proposals.push(proposal);
    }

    return proposals;
  }
}
