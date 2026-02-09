import { eq } from "drizzle-orm";
import { Id } from "../../domain/id";
import { DifficultyLevel } from "../../domain/question/difficulty";
import { QuestionProposalEvent } from "../../domain/question-proposal/events";
import { QuestionProposal } from "../../domain/question-proposal/question-proposal";
import { QuestionProposalRepository } from "../../domain/question-proposal/question-proposal-repository";
import { Transaction } from "../db/client";
import {
  questionProposalEvents,
  questionProposalProjections,
} from "../db/schema";

export class DrizzleQuestionProposalRepository implements QuestionProposalRepository {
  async save(
    tx: Transaction,
    proposal: QuestionProposal,
    event: QuestionProposalEvent,
  ): Promise<void> {
    await tx.insert(questionProposalEvents).values({
      questionProposalId: event.payload.questionProposalId,
      type: event.type,
      payload: event.payload,
      occurredAt: event.occurredAt,
    });

    await tx
      .insert(questionProposalProjections)
      .values({
        questionProposalId: proposal.id,
        status: proposal.status.value,
        text: proposal.text.value,
        difficulty: proposal.difficulty.value as DifficultyLevel,
        choices: [...proposal.choices],
        correctIndexes: [...proposal.correctIndexes.values],
        explanation: proposal.explanation.value,
        categoryId: proposal.categoryId,
        rejectReason: proposal.rejectReason?.value,
        questionCreated: false,
        createdAt: event.occurredAt,
        updatedAt: event.occurredAt,
      })
      .onConflictDoUpdate({
        target: questionProposalProjections.questionProposalId,
        set: {
          status: proposal.status.value,
          text: proposal.text.value,
          difficulty: proposal.difficulty.value as DifficultyLevel,
          choices: [...proposal.choices],
          correctIndexes: [...proposal.correctIndexes.values],
          explanation: proposal.explanation.value,
          categoryId: proposal.categoryId,
          rejectReason: proposal.rejectReason?.value,
          updatedAt: event.occurredAt,
        },
      });
  }

  async findById(
    tx: Transaction,
    questionProposalId: Id<QuestionProposal>,
  ): Promise<QuestionProposal> {
    const rows = await tx
      .select({
        id: questionProposalEvents.id,
        questionProposalId: questionProposalEvents.questionProposalId,
        type: questionProposalEvents.type,
        payload: questionProposalEvents.payload,
        occurredAt: questionProposalEvents.occurredAt,
      })
      .from(questionProposalEvents)
      .where(eq(questionProposalEvents.questionProposalId, questionProposalId))
      .orderBy(questionProposalEvents.occurredAt);

    const events = rows.map(
      (row) =>
        ({
          type: row.type,
          payload: row.payload,
          occurredAt: row.occurredAt,
        }) as QuestionProposalEvent,
    );

    return QuestionProposal.fromEvents(events);
  }
}
