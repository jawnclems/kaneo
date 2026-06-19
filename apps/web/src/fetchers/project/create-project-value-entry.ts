import { client } from "@kaneo/libs";

type CreateProjectValueEntryRequest = {
  projectId: string;
  title: string;
  category: "cost_savings" | "revenue" | "efficiency" | "quality" | "other";
  metric?: string;
  description?: string;
};

async function createProjectValueEntry({
  projectId,
  title,
  category,
  metric,
  description,
}: CreateProjectValueEntryRequest) {
  const response = await client.project[":id"].value.$post({
    param: { id: projectId },
    json: { title, category, metric, description },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default createProjectValueEntry;
