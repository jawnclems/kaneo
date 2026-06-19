import { asc, eq } from "drizzle-orm";
import db from "../../database";
import { projectValueEntryTable } from "../../database/schema";

async function getProjectValueEntries(projectId: string) {
  const entries = await db
    .select()
    .from(projectValueEntryTable)
    .where(eq(projectValueEntryTable.projectId, projectId))
    .orderBy(asc(projectValueEntryTable.createdAt));

  return entries;
}

export default getProjectValueEntries;
