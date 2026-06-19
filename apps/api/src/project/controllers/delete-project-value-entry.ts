import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectValueEntryTable } from "../../database/schema";

async function deleteProjectValueEntry(entryId: string, workspaceId: string) {
  const [existingEntry] = await db
    .select()
    .from(projectValueEntryTable)
    .where(
      and(
        eq(projectValueEntryTable.id, entryId),
        eq(projectValueEntryTable.workspaceId, workspaceId),
      ),
    );

  if (!existingEntry) {
    throw new HTTPException(404, {
      message:
        "Value entry doesn't exist or doesn't belong to the specified workspace",
    });
  }

  const [deletedEntry] = await db
    .delete(projectValueEntryTable)
    .where(eq(projectValueEntryTable.id, entryId))
    .returning();

  if (!deletedEntry) {
    throw new HTTPException(500, {
      message: "Failed to delete value entry",
    });
  }

  return deletedEntry;
}

export default deleteProjectValueEntry;
