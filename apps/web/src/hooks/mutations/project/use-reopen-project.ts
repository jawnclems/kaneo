import { useMutation, useQueryClient } from "@tanstack/react-query";
import reopenProject from "@/fetchers/project/reopen-project";

function useReopenProject({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reopenProject,
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

export default useReopenProject;
