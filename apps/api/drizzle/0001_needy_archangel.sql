CREATE TYPE "public"."experience_action" AS ENUM('drill_complete', 'proposal_submit', 'proposal_approved');--> statement-breakpoint
CREATE TABLE "experience_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"action" "experience_action" NOT NULL,
	"amount" integer NOT NULL,
	"reference_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_experience_logs_user_action_ref" UNIQUE("user_id","action","reference_id")
);
--> statement-breakpoint
CREATE TABLE "rank_up_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"new_rank" integer NOT NULL,
	"previous_rank" integer NOT NULL,
	"displayed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_experience" (
	"user_id" text PRIMARY KEY NOT NULL,
	"total_exp" integer DEFAULT 0 NOT NULL,
	"current_rank" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "experience_logs" ADD CONSTRAINT "experience_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_up_events" ADD CONSTRAINT "rank_up_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_experience" ADD CONSTRAINT "user_experience_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_experience_logs_user_id" ON "experience_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_experience_logs_user_action" ON "experience_logs" USING btree ("user_id","action");--> statement-breakpoint
CREATE INDEX "idx_rank_up_events_user_displayed" ON "rank_up_events" USING btree ("user_id","displayed_at");