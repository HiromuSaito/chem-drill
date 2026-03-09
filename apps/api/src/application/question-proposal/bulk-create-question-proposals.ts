import type { Category } from "../../domain/category/entity/category.ts";
import { Id } from "../../domain/shared/id.ts";
import { CorrectIndexes } from "../../domain/shared/value-object/correct-indexes.ts";
import { Difficulty } from "../../domain/shared/value-object/difficulty.ts";
import { Explanation } from "../../domain/shared/value-object/explanation.ts";
import { QuestionText } from "../../domain/shared/value-object/question-text.ts";
import { QuestionProposal } from "../../domain/question-proposal/entity/question-proposal.ts";
import type { QuestionProposalRepository } from "../../domain/question-proposal/repository/question-proposal-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";
import type { GeneratedQuestion } from "./question-generation-service.ts";

export class BulkCreateQuestionProposals {
  constructor(
    private uow: UnitOfWork,
    private questionProposalRepository: QuestionProposalRepository,
  ) {}

  async execute(input: {
    categoryId: string;
    questions: GeneratedQuestion[];
  }): Promise<QuestionProposal[]> {
    const categoryId = Id.of<Category>(input.categoryId);
    const proposals: QuestionProposal[] = [];

    for (const q of input.questions) {
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
