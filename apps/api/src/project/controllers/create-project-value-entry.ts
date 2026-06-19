import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable, projectValueEntryTable } from "../../database/schema";

async function createProjectValueEntry(
  projectId: string,
  workspaceId: string,
  title: string,
  category: string,
  metric?: string,
  description?: string,
) {
  const [existingProject] = await db
    .select()
    .from(projectTable)
    .where(
      and(
        eq(projectTable.id, projectId),
        eq(projectTable.workspaceId, workspaceId),
      ),
    );

  if (!existingProject) {
    throw new HTTPException(404, {
      message:
        "Project doesn't exist or doesn't belong to the specified workspace",
    });
  }

  const [entry] = await db
    .insert(projectValueEntryTable)
    .values({
      projectId,
      workspaceId,
      title,
      metric: metric ?? null,
      category,
      description: description ?? null,
    })
    .returning();

  if (!entry) {
    throw new HTTPException(500, {
      message: "Failed to create value entry",
    });
  }

  return entry;
}

export default createProjectValueEntry;
