import { useQuery } from "@tanstack/react-query";
import getProjectValueEntries from "@/fetchers/project/get-project-value-entries";

function useGetProjectValueEntries({ projectId }: { projectId: string }) {
  return useQuery({
    queryFn: () => getProjectValueEntries(projectId),
    queryKey: ["project-value-entries", projectId],
    enabled: !!projectId,
  });
}

export default useGetProjectValueEntries;
