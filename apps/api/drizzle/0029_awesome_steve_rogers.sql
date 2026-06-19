CREATE TABLE "project_value_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"title" text NOT NULL,
	"metric" text,
	"category" text DEFAULT 'other' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "project_value_entry" ADD CONSTRAINT "project_value_entry_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_value_entry" ADD CONSTRAINT "project_value_entry_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "project_value_entry_projectId_idx" ON "project_value_entry" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_value_entry_workspaceId_idx" ON "project_value_entry" USING btree ("workspace_id");