import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type ReopenProjectRequest = InferRequestType<
  (typeof client)["project"][":id"]["reopen"]["$put"]
>["param"];

async function reopenProject({ id }: ReopenProjectRequest) {
  const response = await client.project[":id"].reopen.$put({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default reopenProject;
