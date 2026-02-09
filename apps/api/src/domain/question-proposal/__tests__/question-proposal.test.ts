import { describe, expect, it } from "vitest";
import type { Category } from "../../category/category.js";
import { Id } from "../../id.js";
import { CorrectIndexes } from "../../question/correct-indexes.js";
import { Difficulty } from "../../question/difficulty.js";
import { Explanation } from "../../question/explanation.js";
import { QuestionText } from "../../question/question-text.js";
import type { QuestionProposalEvent } from "../events.js";
import { QuestionProposal } from "../question-proposal.js";
import { RejectReason } from "../reject-reason.js";

function buildCreateParams() {
  return {
    questionText: QuestionText.create("SDSの記載項目として正しいものはどれか"),
    difficulty: Difficulty.create("medium"),
    choices: ["GHS分類", "市場価格", "製造者の趣味", "天気予報"] as const,
    correctIndexes: CorrectIndexes.create([0]),
    explanation: Explanation.create("GHS分類はSDSの必須記載項目です。"),
    categoryId: Id.of<Category>("550e8400-e29b-41d4-a716-446655440099"),
  };
}

function buildEditParams() {
  return {
    questionText: QuestionText.create("編集後の問題文"),
    difficulty: Difficulty.create("hard"),
    choices: ["選択肢A", "選択肢B", "選択肢C", "選択肢D"] as const,
    correctIndexes: CorrectIndexes.create([1]),
    explanation: Explanation.create("編集後の解説"),
    categoryId: Id.of<Category>("550e8400-e29b-41d4-a716-446655440099"),
  };
}

describe("QuestionProposal", () => {
  describe("create", () => {
    it("インスタンスとイベントが生成される", () => {
      const { proposal, event } = QuestionProposal.create(buildCreateParams());

      expect(event.type).toBe("QuestionProposalCreated");
      expect(event.payload.questionText.value).toBe(
        "SDSの記載項目として正しいものはどれか",
      );
      expect(event.payload.difficulty.value).toBe("medium");
      expect(event.payload.choices).toHaveLength(4);
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(proposal).toBeInstanceOf(QuestionProposal);
    });
  });

  describe("approve", () => {
    it("pending から approved に遷移できる", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());

      const { proposal: approved, event } = proposal.approve();

      expect(event.type).toBe("QuestionProposalApproved");
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(approved).toBe(proposal);
    });

    it("approved 状態で approve するとエラー", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());
      proposal.approve();

      expect(() => proposal.approve()).toThrow(
        "問題提案を承認できるステータスではありません",
      );
    });

    it("rejected 状態で approve するとエラー", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());
      proposal.reject(RejectReason.create("内容が不正確"));

      expect(() => proposal.approve()).toThrow(
        "問題提案を承認できるステータスではありません",
      );
    });
  });

  describe("reject", () => {
    it("pending から rejected に遷移できる", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());

      const { proposal: rejected, event } = proposal.reject(
        RejectReason.create("内容が不正確"),
      );

      expect(event.type).toBe("QuestionProposalRejected");
      expect(event.payload.rejectReason.value).toBe("内容が不正確");
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(rejected).toBe(proposal);
    });

    it("approved 状態で reject するとエラー", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());
      proposal.approve();

      expect(() => proposal.reject(RejectReason.create("理由"))).toThrow(
        "問題提案を却下できるステータスではありません",
      );
    });

    it("rejected 状態で reject するとエラー", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());
      proposal.reject(RejectReason.create("内容が不正確"));

      expect(() => proposal.reject(RejectReason.create("別の理由"))).toThrow(
        "問題提案を却下できるステータスではありません",
      );
    });
  });

  describe("edit", () => {
    it("pending 状態で編集できる", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());

      const { proposal: edited, event } = proposal.edit(buildEditParams());

      expect(event.type).toBe("QuestionProposalEdited");
      expect(event.payload.questionText.value).toBe("編集後の問題文");
      expect(event.payload.difficulty.value).toBe("hard");
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(edited).toBe(proposal);
    });

    it("rejected 状態で編集でき、pending に戻る", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());
      proposal.reject(RejectReason.create("内容が不正確"));

      const { event } = proposal.edit(buildEditParams());

      expect(event.type).toBe("QuestionProposalEdited");
      // 編集後は pending に戻るので approve できる
      expect(() => proposal.approve()).not.toThrow();
    });

    it("approved 状態で編集するとエラー", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());
      proposal.approve();

      expect(() => proposal.edit(buildEditParams())).toThrow(
        "問題提案を編集できるステータスではありません",
      );
    });
  });

  describe("fromEvents", () => {
    it("空のイベントリストはエラー", () => {
      expect(() => QuestionProposal.fromEvents([])).toThrow("イベントが空です");
    });

    it("最初のイベントが QuestionProposalCreated でないとエラー", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());
      const { event: approvedEvent } = proposal.approve();

      expect(() => QuestionProposal.fromEvents([approvedEvent])).toThrow(
        "最初のイベントは QuestionProposalCreated である必要があります",
      );
    });

    it("QuestionProposalCreated から復元できる", () => {
      const { event } = QuestionProposal.create(buildCreateParams());

      const restored = QuestionProposal.fromEvents([event]);

      expect(restored).toBeInstanceOf(QuestionProposal);
      // pending 状態なので approve できる
      expect(() => restored.approve()).not.toThrow();
    });

    it("複数イベントから状態を復元できる（編集）", () => {
      const { proposal, event: createdEvent } =
        QuestionProposal.create(buildCreateParams());
      const { event: editedEvent } = proposal.edit(buildEditParams());

      const events: QuestionProposalEvent[] = [createdEvent, editedEvent];
      const restored = QuestionProposal.fromEvents(events);

      // pending 状態なので approve できる
      expect(() => restored.approve()).not.toThrow();
    });

    it("複数イベントから状態を復元できる（承認）", () => {
      const { proposal, event: createdEvent } =
        QuestionProposal.create(buildCreateParams());
      const { event: approvedEvent } = proposal.approve();

      const events: QuestionProposalEvent[] = [createdEvent, approvedEvent];
      const restored = QuestionProposal.fromEvents(events);

      // approved 状態なので approve するとエラー
      expect(() => restored.approve()).toThrow(
        "問題提案を承認できるステータスではありません",
      );
    });

    it("複数イベントから状態を復元できる（却下→編集→承認）", () => {
      const { proposal, event: createdEvent } =
        QuestionProposal.create(buildCreateParams());
      const { event: rejectedEvent } = proposal.reject(
        RejectReason.create("修正が必要"),
      );
      const { event: editedEvent } = proposal.edit(buildEditParams());
      const { event: approvedEvent } = proposal.approve();

      const events: QuestionProposalEvent[] = [
        createdEvent,
        rejectedEvent,
        editedEvent,
        approvedEvent,
      ];
      const restored = QuestionProposal.fromEvents(events);

      // approved 状態なので edit するとエラー
      expect(() => restored.edit(buildEditParams())).toThrow(
        "問題提案を編集できるステータスではありません",
      );
    });
  });
});
