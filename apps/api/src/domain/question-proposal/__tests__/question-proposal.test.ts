import { describe, expect, it } from "vitest";
import type { Category } from "../../category/entity/category.ts";
import { ForbiddenError } from "../../shared/errors.ts";
import { Id } from "../../shared/id.ts";
import { CorrectIndexes } from "../../shared/value-object/correct-indexes.ts";
import { Difficulty } from "../../shared/value-object/difficulty.ts";
import { Explanation } from "../../shared/value-object/explanation.ts";
import { QuestionText } from "../../shared/value-object/question-text.ts";
import type { QuestionProposalEvent } from "../event/events.ts";
import { QuestionProposal } from "../entity/question-proposal.ts";
import { RejectReason } from "../value-object/reject-reason.ts";

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

/** pending → reviewed に遷移済みの proposal を生成するヘルパー */
function buildReviewedProposal() {
  const { proposal } = QuestionProposal.create(buildCreateParams());
  const { proposal: reviewed } = proposal.submit();
  return reviewed;
}

/** pending → reviewed → approved に遷移済みの proposal を生成するヘルパー */
function buildApprovedProposal() {
  const reviewed = buildReviewedProposal();
  const { proposal: approved } = reviewed.approve();
  return approved;
}

describe("QuestionProposal", () => {
  describe("ensureOwnedBy", () => {
    it("所有者が一致する場合はエラーにならない", () => {
      const { proposal } = QuestionProposal.create({
        ...buildCreateParams(),
        userId: "user-123",
      });

      expect(() => proposal.ensureOwnedBy("user-123")).not.toThrow();
    });

    it("所有者が不一致の場合はエラーをスローする", () => {
      const { proposal } = QuestionProposal.create({
        ...buildCreateParams(),
        userId: "user-123",
      });

      expect(() => proposal.ensureOwnedBy("other-user")).toThrowError(
        ForbiddenError,
      );
    });
  });

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

  describe("submit", () => {
    it("pending から reviewed に遷移できる", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());

      const { proposal: submitted, event } = proposal.submit();

      expect(event.type).toBe("QuestionProposalSubmitted");
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(submitted).not.toBe(proposal);
      expect(submitted.status).toEqual(
        expect.objectContaining({ value: "reviewed" }),
      );
    });

    it("reviewed 状態で submit するとエラー", () => {
      const reviewed = buildReviewedProposal();

      expect(() => reviewed.submit()).toThrow(
        "出題案を申請できるステータスではありません",
      );
    });

    it("approved 状態で submit するとエラー", () => {
      const approved = buildApprovedProposal();

      expect(() => approved.submit()).toThrow(
        "出題案を申請できるステータスではありません",
      );
    });
  });

  describe("approve", () => {
    it("reviewed から approved に遷移できる", () => {
      const reviewed = buildReviewedProposal();

      const { proposal: approved, event } = reviewed.approve();

      expect(event.type).toBe("QuestionProposalApproved");
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(approved).not.toBe(reviewed);
      expect(approved.status).toEqual(
        expect.objectContaining({ value: "approved" }),
      );
    });

    it("pending 状態で approve するとエラー", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());

      expect(() => proposal.approve()).toThrow(
        "出題案を承認できるステータスではありません",
      );
    });

    it("approved 状態で approve するとエラー", () => {
      const approved = buildApprovedProposal();

      expect(() => approved.approve()).toThrow(
        "出題案を承認できるステータスではありません",
      );
    });

    it("rejected 状態で approve するとエラー", () => {
      const reviewed = buildReviewedProposal();
      const { proposal: rejected } = reviewed.reject(
        RejectReason.create("内容が不正確"),
      );

      expect(() => rejected.approve()).toThrow(
        "出題案を承認できるステータスではありません",
      );
    });
  });

  describe("reject", () => {
    it("reviewed から rejected に遷移できる", () => {
      const reviewed = buildReviewedProposal();

      const { proposal: rejected, event } = reviewed.reject(
        RejectReason.create("内容が不正確"),
      );

      expect(event.type).toBe("QuestionProposalRejected");
      expect(event.payload.rejectReason.value).toBe("内容が不正確");
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(rejected).not.toBe(reviewed);
      expect(rejected.status).toEqual(
        expect.objectContaining({ value: "rejected" }),
      );
    });

    it("pending 状態で reject するとエラー", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());

      expect(() => proposal.reject(RejectReason.create("理由"))).toThrow(
        "出題案を却下できるステータスではありません",
      );
    });

    it("approved 状態で reject するとエラー", () => {
      const approved = buildApprovedProposal();

      expect(() => approved.reject(RejectReason.create("理由"))).toThrow(
        "出題案を却下できるステータスではありません",
      );
    });

    it("rejected 状態で reject するとエラー", () => {
      const reviewed = buildReviewedProposal();
      const { proposal: rejected } = reviewed.reject(
        RejectReason.create("内容が不正確"),
      );

      expect(() => rejected.reject(RejectReason.create("別の理由"))).toThrow(
        "出題案を却下できるステータスではありません",
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
      expect(edited).not.toBe(proposal);
      expect(edited.text.value).toBe("編集後の問題文");
    });

    it("rejected 状態で編集でき、pending に戻る", () => {
      const reviewed = buildReviewedProposal();
      const { proposal: rejected } = reviewed.reject(
        RejectReason.create("内容が不正確"),
      );

      const { proposal: edited, event } = rejected.edit(buildEditParams());

      expect(event.type).toBe("QuestionProposalEdited");
      expect(edited.status).toEqual(
        expect.objectContaining({ value: "pending" }),
      );
    });

    it("approved 状態で edit するとエラー（editApproved を使うべき）", () => {
      const approved = buildApprovedProposal();

      expect(() => approved.edit(buildEditParams())).toThrow(
        "承認済みの出題案は管理者のみ変更できます",
      );
    });

    it("reviewed 状態で edit するとエラー", () => {
      const reviewed = buildReviewedProposal();

      expect(() => reviewed.edit(buildEditParams())).toThrow(
        "出題案を編集できるステータスではありません",
      );
    });
  });

  describe("editApproved", () => {
    it("approved 状態で編集でき、approved のまま維持される", () => {
      const approved = buildApprovedProposal();

      const { proposal: edited, event } =
        approved.editApproved(buildEditParams());

      expect(event.type).toBe("QuestionProposalApprovedEdited");
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(edited.text.value).toBe("編集後の問題文");
      expect(edited.status).toEqual(
        expect.objectContaining({ value: "approved" }),
      );
    });

    it("pending 状態で editApproved するとエラー", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());

      expect(() => proposal.editApproved(buildEditParams())).toThrow(
        "承認済みの出題案ではありません",
      );
    });

    it("reviewed 状態で editApproved するとエラー", () => {
      const reviewed = buildReviewedProposal();

      expect(() => reviewed.editApproved(buildEditParams())).toThrow(
        "承認済みの出題案ではありません",
      );
    });
  });

  describe("withdraw", () => {
    it("approved から withdrawn に遷移できる", () => {
      const approved = buildApprovedProposal();

      const { proposal: withdrawn, event } = approved.withdraw();

      expect(event.type).toBe("QuestionProposalWithdrawn");
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(withdrawn).not.toBe(approved);
      expect(withdrawn.status).toEqual(
        expect.objectContaining({ value: "withdrawn" }),
      );
    });

    it("pending 状態で withdraw するとエラー", () => {
      const { proposal } = QuestionProposal.create(buildCreateParams());

      expect(() => proposal.withdraw()).toThrow(
        "出題案を取り下げできるステータスではありません",
      );
    });

    it("reviewed 状態で withdraw するとエラー", () => {
      const reviewed = buildReviewedProposal();

      expect(() => reviewed.withdraw()).toThrow(
        "出題案を取り下げできるステータスではありません",
      );
    });

    it("withdrawn 状態で withdraw するとエラー", () => {
      const approved = buildApprovedProposal();
      const { proposal: withdrawn } = approved.withdraw();

      expect(() => withdrawn.withdraw()).toThrow(
        "出題案を取り下げできるステータスではありません",
      );
    });
  });

  describe("fromEvents", () => {
    it("空のイベントリストはエラー", () => {
      expect(() => QuestionProposal.fromEvents([])).toThrow("イベントが空です");
    });

    it("最初のイベントが QuestionProposalCreated でないとエラー", () => {
      const reviewed = buildReviewedProposal();
      const { event: approvedEvent } = reviewed.approve();

      expect(() => QuestionProposal.fromEvents([approvedEvent])).toThrow(
        "最初のイベントは QuestionProposalCreated である必要があります",
      );
    });

    it("QuestionProposalCreated から復元できる", () => {
      const { event } = QuestionProposal.create(buildCreateParams());

      const restored = QuestionProposal.fromEvents([event]);

      expect(restored).toBeInstanceOf(QuestionProposal);
      expect(restored.status).toEqual(
        expect.objectContaining({ value: "pending" }),
      );
    });

    it("複数イベントから状態を復元できる（編集）", () => {
      const { proposal, event: createdEvent } =
        QuestionProposal.create(buildCreateParams());
      const { event: editedEvent } = proposal.edit(buildEditParams());

      const events: QuestionProposalEvent[] = [createdEvent, editedEvent];
      const restored = QuestionProposal.fromEvents(events);

      expect(restored.status).toEqual(
        expect.objectContaining({ value: "pending" }),
      );
      expect(restored.text.value).toBe("編集後の問題文");
    });

    it("複数イベントから状態を復元できる（申請→承認）", () => {
      const { proposal, event: createdEvent } =
        QuestionProposal.create(buildCreateParams());
      const { proposal: submitted, event: submittedEvent } = proposal.submit();
      const { event: approvedEvent } = submitted.approve();

      const events: QuestionProposalEvent[] = [
        createdEvent,
        submittedEvent,
        approvedEvent,
      ];
      const restored = QuestionProposal.fromEvents(events);

      expect(restored.status).toEqual(
        expect.objectContaining({ value: "approved" }),
      );
    });

    it("複数イベントから状態を復元できる（申請→承認→取り下げ）", () => {
      const { proposal, event: createdEvent } =
        QuestionProposal.create(buildCreateParams());
      const { proposal: submitted, event: submittedEvent } = proposal.submit();
      const { proposal: approved, event: approvedEvent } = submitted.approve();
      const { event: withdrawnEvent } = approved.withdraw();

      const events: QuestionProposalEvent[] = [
        createdEvent,
        submittedEvent,
        approvedEvent,
        withdrawnEvent,
      ];
      const restored = QuestionProposal.fromEvents(events);

      expect(restored.status).toEqual(
        expect.objectContaining({ value: "withdrawn" }),
      );
    });

    it("複数イベントから状態を復元できる（申請→却下→編集→再申請→承認→承認済み編集）", () => {
      const { proposal, event: createdEvent } =
        QuestionProposal.create(buildCreateParams());
      const { proposal: submitted, event: submittedEvent } = proposal.submit();
      const { proposal: rejected, event: rejectedEvent } = submitted.reject(
        RejectReason.create("修正が必要"),
      );
      const { proposal: edited, event: editedEvent } =
        rejected.edit(buildEditParams());
      const { proposal: resubmitted, event: resubmittedEvent } =
        edited.submit();
      const { proposal: approved, event: approvedEvent } =
        resubmitted.approve();
      const { event: approvedEditedEvent } =
        approved.editApproved(buildEditParams());

      const events: QuestionProposalEvent[] = [
        createdEvent,
        submittedEvent,
        rejectedEvent,
        editedEvent,
        resubmittedEvent,
        approvedEvent,
        approvedEditedEvent,
      ];
      const restored = QuestionProposal.fromEvents(events);

      expect(restored.status).toEqual(
        expect.objectContaining({ value: "approved" }),
      );
      expect(restored.text.value).toBe("編集後の問題文");
    });
  });
});
