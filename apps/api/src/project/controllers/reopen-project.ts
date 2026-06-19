import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable } from "../../database/schema";

async function reopenProject(id: string, workspaceId: string) {
  const [existingProject] = await db
    .select()
    .from(projectTable)
    .where(
      and(eq(projectTable.id, id), eq(projectTable.workspaceId, workspaceId)),
    );

  if (!existingProject) {
    throw new HTTPException(404, {
      message:
        "Project doesn't exist or doesn't belong to the specified workspace",
    });
  }

  const [reopenedProject] = await db
    .update(projectTable)
    .set({ completedAt: null })
    .where(eq(projectTable.id, id))
    .returning();

  if (!reopenedProject) {
    throw new HTTPException(500, {
      message: "Failed to reopen project",
    });
  }

  return reopenedProject;
}

export default reopenProject;
