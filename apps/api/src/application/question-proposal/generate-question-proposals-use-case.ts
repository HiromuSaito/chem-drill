import type { Category } from "../../domain/category/category.js";
import { Id } from "../../domain/id.js";
import { CorrectIndexes } from "../../domain/question/correct-indexes.js";
import { Difficulty } from "../../domain/question/difficulty.js";
import { Explanation } from "../../domain/question/explanation.js";
import { QuestionText } from "../../domain/question/question-text.js";
import { QuestionProposal } from "../../domain/question-proposal/question-proposal.js";
import type { QuestionProposalRepository } from "../../domain/question-proposal/question-proposal-repository.js";
import type { UnitOfWork } from "../unit-of-work.js";
import type { QuestionGenerationService } from "./question-generation-service.js";

const QUESTION_COUNT = 10;

export class GenerateQuestionProposalsUseCase {
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
