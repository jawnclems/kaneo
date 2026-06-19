import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteProjectValueEntry from "@/fetchers/project/delete-project-value-entry";

function useDeleteProjectValueEntry({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProjectValueEntry,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-value-entries", projectId],
      });
    },
  });
}

export default useDeleteProjectValueEntry;
