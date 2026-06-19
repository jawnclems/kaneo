import { useMutation, useQueryClient } from "@tanstack/react-query";
import createProjectValueEntry from "@/fetchers/project/create-project-value-entry";

function useCreateProjectValueEntry({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProjectValueEntry,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-value-entries", projectId],
      });
    },
  });
}

export default useCreateProjectValueEntry;
