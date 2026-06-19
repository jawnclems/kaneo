import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type CompleteProjectRequest = InferRequestType<
  (typeof client)["project"][":id"]["complete"]["$put"]
>["param"];

async function completeProject({ id }: CompleteProjectRequest) {
  const response = await client.project[":id"].complete.$put({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default completeProject;
