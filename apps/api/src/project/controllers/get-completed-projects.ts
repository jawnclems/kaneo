import { and, eq, isNotNull } from "drizzle-orm";
import db from "../../database";
import { projectTable } from "../../database/schema";

async function getCompletedProjects(workspaceId: string) {
  const projects = await db.query.projectTable.findMany({
    where: and(
      eq(projectTable.workspaceId, workspaceId),
      isNotNull(projectTable.completedAt),
    ),
    with: {
      valueEntries: true,
      tasks: true,
    },
  });

  return projects.map((project) => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(
      (task) => task.status === "done" || task.status === "archived",
    ).length;
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...project,
      statistics: {
        completionPercentage,
        totalTasks,
      },
    };
  });
}

export default getCompletedProjects;
