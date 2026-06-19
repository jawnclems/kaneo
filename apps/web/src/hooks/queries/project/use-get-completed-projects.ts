import { useQuery } from "@tanstack/react-query";
import getCompletedProjects from "@/fetchers/project/get-completed-projects";

function useGetCompletedProjects({ workspaceId }: { workspaceId: string }) {
  return useQuery({
    queryFn: () => getCompletedProjects(workspaceId),
    queryKey: ["completed-projects", workspaceId],
    enabled: !!workspaceId,
  });
}

export default useGetCompletedProjects;
