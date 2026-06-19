import { useMutation, useQueryClient } from "@tanstack/react-query";
import completeProject from "@/fetchers/project/complete-project";

function useCompleteProject({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeProject,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] }),
        queryClient.invalidateQueries({
          queryKey: ["completed-projects", workspaceId],
        }),
      ]);
    },
  });
}

export default useCompleteProject;
