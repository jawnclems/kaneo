import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import WorkspaceLayout from "@/components/common/workspace-layout";
import PageTitle from "@/components/page-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import icons from "@/constants/project-icons";
import useReopenProject from "@/hooks/mutations/project/use-reopen-project";
import useGetCompletedProjects from "@/hooks/queries/project/use-get-completed-projects";
import { formatDateMedium } from "@/lib/format";
import { toast } from "@/lib/toast";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/completed",
)({
  component: RouteComponent,
});

const CATEGORY_VARIANTS = {
  cost_savings: "success",
  revenue: "success",
  efficiency: "info",
  quality: "info",
  other: "outline",
} as const;

function RouteComponent() {
  const { t } = useTranslation();
  const { workspaceId } = Route.useParams();
  const { data: projects, isLoading } = useGetCompletedProjects({
    workspaceId,
  });
  const { mutateAsync: reopenProject } = useReopenProject({ workspaceId });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (projectId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleReopen = async (projectId: string) => {
    try {
      await reopenProject({ id: projectId });
      toast.success(t("workspace:completed.reopenedToast"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("workspace:completed.reopenErrorToast"),
      );
    }
  };

  const pageTitle = t("workspace:completed.pageTitle");

  if (isLoading) {
    return (
      <>
        <PageTitle title={pageTitle} />
        <WorkspaceLayout title={pageTitle}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-foreground font-medium">
                  {t("workspace:completed.projectColumn")}
                </TableHead>
                <TableHead className="text-foreground font-medium">
                  {t("workspace:completed.completedOnColumn")}
                </TableHead>
                <TableHead className="text-foreground font-medium">
                  {t("workspace:completed.valueEntriesColumn")}
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-5 w-8" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-7 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </WorkspaceLayout>
      </>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <>
        <PageTitle title={pageTitle} />
        <WorkspaceLayout title={pageTitle}>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-xl bg-muted flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  {t("workspace:completed.emptyTitle")}
                </h3>
                <p className="text-muted-foreground">
                  {t("workspace:completed.emptyDescription")}
                </p>
              </div>
            </div>
          </div>
        </WorkspaceLayout>
      </>
    );
  }

  return (
    <>
      <PageTitle title={pageTitle} />
      <WorkspaceLayout title={pageTitle}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-foreground font-medium w-8" />
              <TableHead className="text-foreground font-medium">
                {t("workspace:completed.projectColumn")}
              </TableHead>
              <TableHead className="text-foreground font-medium">
                {t("workspace:completed.completedOnColumn")}
              </TableHead>
              <TableHead className="text-foreground font-medium">
                {t("workspace:completed.valueEntriesColumn")}
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              if (!project?.id) return null;

              const IconComponent =
                icons[project.icon as keyof typeof icons] || icons.Layout;
              const isExpanded = expandedRows.has(project.id);
              const valueEntries = project.valueEntries ?? [];

              return (
                <>
                  <TableRow key={project.id}>
                    <TableCell className="py-3 w-8">
                      {valueEntries.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleRow(project.id)}
                          className="flex items-center justify-center h-5 w-5 text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-5 h-5 text-muted-foreground shrink-0" />
                        <span className="font-medium">{project.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm text-muted-foreground">
                        {project.completedAt
                          ? formatDateMedium(new Date(project.completedAt))
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      {valueEntries.length > 0 ? (
                        <Badge variant="outline" size="sm">
                          {valueEntries.length}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleReopen(project.id)}
                      >
                        {t("workspace:completed.reopenButton")}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {isExpanded && valueEntries.length > 0 && (
                    <TableRow
                      key={`${project.id}-entries`}
                      className="bg-muted/30 hover:bg-muted/30"
                    >
                      <TableCell />
                      <TableCell colSpan={4} className="py-2 pb-3">
                        <div className="space-y-1.5">
                          {valueEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-start gap-2 pl-2"
                            >
                              <Badge
                                variant={
                                  CATEGORY_VARIANTS[
                                    entry.category as keyof typeof CATEGORY_VARIANTS
                                  ] ?? "outline"
                                }
                                size="sm"
                                className="shrink-0 mt-0.5 capitalize"
                              >
                                {entry.category.replace("_", " ")}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium">
                                  {entry.title}
                                </span>
                                {entry.metric && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {entry.metric}
                                  </span>
                                )}
                                {entry.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {entry.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </WorkspaceLayout>
    </>
  );
}
