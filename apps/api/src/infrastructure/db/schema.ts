import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: varchar("text", { length: 500 }).notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  choices: jsonb("choices").notNull().$type<string[]>(),
  correctIndexes: integer("correct_indexes").array().notNull(),
  explanation: varchar("explanation", { length: 1000 }).notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const questionProposalEventTypeEnum = pgEnum(
  "question_proposal_event_type",
  [
    "QuestionProposalCreated",
    "QuestionProposalEdited",
    "QuestionProposalApproved",
    "QuestionProposalRejected",
  ],
);

export const questionProposalEvents = pgTable(
  "question_proposal_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionProposalId: uuid("question_proposal_id").notNull(),
    type: questionProposalEventTypeEnum("type").notNull(),
    payload: jsonb("payload").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("idx_question_proposal_events_question_proposal_id").on(
      table.questionProposalId,
    ),
    index("idx_question_proposal_events_occurred_at").on(table.occurredAt),
  ],
);

export const questionProposalStatusEnum = pgEnum("question_proposal_status", [
  "pending",
  "approved",
  "rejected",
]);

export const questionProposalProjections = pgTable(
  "question_proposal_projections",
  {
    questionProposalId: uuid("question_proposal_id").primaryKey(),
    status: questionProposalStatusEnum("status").notNull(),
    text: varchar("text", { length: 500 }).notNull(),
    difficulty: difficultyEnum("difficulty").notNull(),
    choices: jsonb("choices").notNull().$type<string[]>(),
    correctIndexes: integer("correct_indexes").array().notNull(),
    explanation: varchar("explanation", { length: 1000 }).notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    rejectReason: varchar("reject_reason", { length: 500 }),
    questionCreated: boolean("question_created").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_question_proposal_projections_status").on(table.status),
    index("idx_question_proposal_projections_category_id").on(table.categoryId),
  ],
);

export const drillSessions = pgTable(
  "drill_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    /** null = 全カテゴリ横断（「すべて」選択時） */
    categoryId: uuid("category_id").references(() => categories.id),
    totalCount: integer("total_count").notNull(),
    correctCount: integer("correct_count").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_drill_sessions_user_id").on(table.userId),
    index("idx_drill_sessions_user_category").on(
      table.userId,
      table.categoryId,
    ),
    index("idx_drill_sessions_completed_at").on(table.completedAt),
  ],
);

export const drillAnswers = pgTable(
  "drill_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => drillSessions.id),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id),
    selectedIndexes: integer("selected_indexes").array().notNull(),
    isCorrect: boolean("is_correct").notNull(),
  },
  (table) => [
    index("idx_drill_answers_session_id").on(table.sessionId),
    index("idx_drill_answers_question_id").on(table.questionId),
  ],
);

export * from "./auth-schema";
