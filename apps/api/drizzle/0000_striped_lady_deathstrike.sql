CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."question_proposal_event_type" AS ENUM('QuestionProposalCreated', 'QuestionProposalEdited', 'QuestionProposalApprovedEdited', 'QuestionProposalApproved', 'QuestionProposalRejected', 'QuestionProposalSubmitted', 'QuestionProposalWithdrawn');--> statement-breakpoint
CREATE TYPE "public"."question_proposal_status" AS ENUM('pending', 'reviewed', 'approved', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "drill_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_indexes" integer[] NOT NULL,
	"is_correct" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drill_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"category_id" uuid,
	"total_count" integer NOT NULL,
	"correct_count" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_proposal_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_proposal_id" uuid NOT NULL,
	"type" "question_proposal_event_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_proposal_projections" (
	"question_proposal_id" uuid PRIMARY KEY NOT NULL,
	"status" "question_proposal_status" NOT NULL,
	"text" varchar(500) NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"choices" jsonb NOT NULL,
	"correct_indexes" integer[] NOT NULL,
	"explanation" varchar(1000) NOT NULL,
	"category_id" uuid NOT NULL,
	"reject_reason" varchar(500),
	"user_id" text,
	"question_id" uuid,
	"question_created" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" varchar(500) NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"choices" jsonb NOT NULL,
	"correct_indexes" integer[] NOT NULL,
	"explanation" varchar(1000) NOT NULL,
	"category_id" uuid NOT NULL,
	"user_id" text,
	"is_published" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"username" text,
	"role" text DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "drill_answers" ADD CONSTRAINT "drill_answers_session_id_drill_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."drill_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drill_answers" ADD CONSTRAINT "drill_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drill_sessions" ADD CONSTRAINT "drill_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drill_sessions" ADD CONSTRAINT "drill_sessions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_proposal_projections" ADD CONSTRAINT "question_proposal_projections_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_drill_answers_session_id" ON "drill_answers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_drill_answers_question_id" ON "drill_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_drill_sessions_user_id" ON "drill_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_drill_sessions_user_category" ON "drill_sessions" USING btree ("user_id","category_id");--> statement-breakpoint
CREATE INDEX "idx_drill_sessions_completed_at" ON "drill_sessions" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "idx_question_proposal_events_question_proposal_id" ON "question_proposal_events" USING btree ("question_proposal_id");--> statement-breakpoint
CREATE INDEX "idx_question_proposal_events_occurred_at" ON "question_proposal_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_question_proposal_projections_status" ON "question_proposal_projections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_question_proposal_projections_category_id" ON "question_proposal_projections" USING btree ("category_id");