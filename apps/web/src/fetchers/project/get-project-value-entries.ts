import { client } from "@kaneo/libs";

async function getProjectValueEntries(projectId: string) {
  if (!projectId) return [];

  const response = await client.project[":id"].value.$get({
    param: { id: projectId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default getProjectValueEntries;
