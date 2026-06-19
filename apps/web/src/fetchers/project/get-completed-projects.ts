import { client } from "@kaneo/libs";

async function getCompletedProjects(workspaceId: string) {
  if (!workspaceId) return [];

  const response = await client.project.completed.$get({
    query: { workspaceId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default getCompletedProjects;
