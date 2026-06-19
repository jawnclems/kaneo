import { client } from "@kaneo/libs";

async function deleteProjectValueEntry({
  projectId,
  entryId,
}: {
  projectId: string;
  entryId: string;
}) {
  const response = await client.project[":id"].value[":entryId"].$delete({
    param: { id: projectId, entryId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default deleteProjectValueEntry;
