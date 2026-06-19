import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  isWeekend,
  parseISO,
  startOfWeek,
  subDays,
} from "date-fns";
import { CalendarDays, Eye, EyeOff, Minus, Plus, Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { GanttTaskBar } from "@/components/gantt/gantt-task-bar";
import PageTitle from "@/components/page-title";
import TaskDetailsSheet from "@/components/task/task-details-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetWorkspaceTasks } from "@/hooks/queries/task/use-get-workspace-tasks";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";
import { getStatusLabel } from "@/lib/i18n/domain";

const MIN_DAY_WIDTH = 1.5;
const MAX_DAY_WIDTH = 6;
const ZOOM_STEP = 0.5;
const DEFAULT_DAY_WIDTH_DESKTOP = 2.75;
const DEFAULT_DAY_WIDTH_MOBILE = 3.125;

type GanttSearchParams = {
  taskId?: string;
  taskProjectId?: string;
};

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/gantt",
)({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): GanttSearchParams => ({
    taskId: typeof search.taskId === "string" ? search.taskId : undefined,
    taskProjectId:
      typeof search.taskProjectId === "string"
        ? search.taskProjectId
        : undefined,
  }),
});

function parseTaskDate(value: string | Date | null) {
  if (!value) return null;
  const parsed = typeof value === "string" ? parseISO(value) : value;
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function RouteComponent() {
  const { t } = useTranslation();
  const { workspaceId } = Route.useParams();
  const { taskId, taskProjectId } = Route.useSearch();
  const navigate = useNavigate();
  const { data: rawTasks = [] } = useGetWorkspaceTasks(workspaceId);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideDone, setHideDone] = useState(false);
  const isMobile = useIsMobile();
  const [isTaskRailOpen, setIsTaskRailOpen] = useState(false);
  const [dayColumnWidthRem, setDayColumnWidthRem] = useState(
    isMobile ? DEFAULT_DAY_WIDTH_MOBILE : DEFAULT_DAY_WIDTH_DESKTOP,
  );

  const taskColumnWidthRem = isMobile ? 12 : 14;
  const showTaskRail = !isMobile || isTaskRailOpen;
  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [pixelsPerDay, setPixelsPerDay] = useState(44);
  const hasScrolledToToday = useRef(false);

  // Drag-to-scroll state
  const [isScrollDragging, setIsScrollDragging] = useState(false);
  const isDraggingScrollRef = useRef(false);
  const dragScrollStart = useRef<{ x: number; scrollLeft: number } | null>(
    null,
  );

  // Row height scales with zoom so more tasks fit when zoomed out
  const rowHeightPx = Math.max(
    24,
    Math.min(
      56,
      Math.round((dayColumnWidthRem / DEFAULT_DAY_WIDTH_DESKTOP) * 44),
    ),
  );
  const isCompactRow = rowHeightPx < 40;
  // Bar sits inside the row with a small vertical gap
  const barHeightPx = Math.max(16, rowHeightPx - 8);

  useEffect(() => {
    if (!isMobile) {
      setIsTaskRailOpen(true);
      setDayColumnWidthRem(DEFAULT_DAY_WIDTH_DESKTOP);
      return;
    }
    setIsTaskRailOpen(false);
    setDayColumnWidthRem(DEFAULT_DAY_WIDTH_MOBILE);
  }, [isMobile]);

  const zoomIn = useCallback(
    () => setDayColumnWidthRem((w) => Math.min(MAX_DAY_WIDTH, w + ZOOM_STEP)),
    [],
  );

  const zoomOut = useCallback(
    () => setDayColumnWidthRem((w) => Math.max(MIN_DAY_WIDTH, w - ZOOM_STEP)),
    [],
  );

  // Drag-to-scroll: only activates for mouse (touch uses native scroll).
  // GanttTaskBar calls stopPropagation on its pointerdown, so bar drags
  // never bubble here and won't accidentally start a scroll drag.
  const handlePointerDownForScroll = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse") return;
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("button")) return;

      const container = scrollContainerRef.current;
      if (!container) return;

      isDraggingScrollRef.current = true;
      dragScrollStart.current = {
        x: e.clientX,
        scrollLeft: container.scrollLeft,
      };
      setIsScrollDragging(true);
    },
    [],
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingScrollRef.current || !dragScrollStart.current) return;
      if (e.pointerType !== "mouse") return;
      const container = scrollContainerRef.current;
      if (!container) return;
      const dx = e.clientX - dragScrollStart.current.x;
      container.scrollLeft = dragScrollStart.current.scrollLeft - dx;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      isDraggingScrollRef.current = false;
      dragScrollStart.current = null;
      setIsScrollDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const parsedTasks = useMemo(() => {
    return rawTasks
      .map((task) => {
        const parsedStart =
          parseTaskDate(task.startDate) ?? parseTaskDate(task.dueDate);
        const parsedEnd =
          parseTaskDate(task.dueDate) ?? parseTaskDate(task.startDate);

        if (!parsedStart || !parsedEnd) return null;

        const start = parsedStart <= parsedEnd ? parsedStart : parsedEnd;
        const end = parsedEnd >= parsedStart ? parsedEnd : parsedStart;

        return {
          ...task,
          description: task.description ?? null,
          columnId: null,
          labels: [],
          externalLinks: [],
          scheduleStart: start,
          scheduleEnd: end,
        };
      })
      .filter((task): task is NonNullable<typeof task> => task !== null)
      .sort(
        (left, right) =>
          left.scheduleStart.getTime() - right.scheduleStart.getTime(),
      );
  }, [rawTasks]);

  const scheduledTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return parsedTasks.filter((task) => {
      if (hideDone && task.status.toLowerCase() === "done") return false;
      if (!normalizedQuery) return true;

      return (
        task.title.toLowerCase().includes(normalizedQuery) ||
        `${task.projectSlug ?? ""}-${task.number ?? ""}`
          .toLowerCase()
          .includes(normalizedQuery) ||
        task.status.toLowerCase().includes(normalizedQuery) ||
        (task.projectName ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [parsedTasks, searchQuery, hideDone]);

  const timeline = useMemo(() => {
    if (parsedTasks.length === 0) return null;

    const earliest = parsedTasks.reduce(
      (current, task) =>
        task.scheduleStart < current ? task.scheduleStart : current,
      parsedTasks[0].scheduleStart,
    );
    const latest = parsedTasks.reduce(
      (current, task) =>
        task.scheduleEnd > current ? task.scheduleEnd : current,
      parsedTasks[0].scheduleEnd,
    );

    const weekStart = startOfWeek(earliest, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(latest, { weekStartsOn: 1 });
    const rangeStart = subDays(weekStart, 7);
    const rangeEnd = addDays(weekEnd, 28);
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

    return {
      days,
      rangeStart,
      gridTemplateColumns: `repeat(${days.length}, minmax(${dayColumnWidthRem}rem, ${dayColumnWidthRem}rem))`,
      timelineMinWidthRem: days.length * dayColumnWidthRem,
    };
  }, [parsedTasks, dayColumnWidthRem]);

  useLayoutEffect(() => {
    const element = timelineTrackRef.current;
    if (!element || !timeline) return;

    const update = () => {
      const count = timeline.days.length;
      if (count <= 0) return;
      setPixelsPerDay(element.clientWidth / count);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [timeline]);

  const scrollToToday = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !timeline) return;

    const daysFromStart = differenceInCalendarDays(
      new Date(),
      timeline.rangeStart,
    );
    const taskRailPx = showTaskRail
      ? isMobile
        ? taskColumnWidthRem * 16
        : 320
      : 0;
    const dayPx = dayColumnWidthRem * 16;
    const todayPx = daysFromStart * dayPx + taskRailPx;

    container.scrollTo({
      left: Math.max(0, todayPx - container.clientWidth / 2),
      behavior: "smooth",
    });
  }, [timeline, showTaskRail, isMobile, taskColumnWidthRem, dayColumnWidthRem]);

  useEffect(() => {
    if (!timeline || hasScrolledToToday.current) return;
    hasScrolledToToday.current = true;
    const timer = setTimeout(scrollToToday, 50);
    return () => clearTimeout(timer);
  }, [timeline, scrollToToday]);

  return (
    <WorkspaceLayout title={t("workspace:gantt.pageTitle")}>
      <PageTitle title={t("workspace:gantt.pageTitle")} hideAppName />
      <div className="flex h-full min-h-0 flex-col bg-background">
        <div className="border-b border-border/80 px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-sm font-semibold text-foreground">
                {t("workspace:gantt.title")}
              </h1>
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("workspace:gantt.searchPlaceholder")}
                className="h-9 min-h-11 touch-manipulation sm:h-8 sm:min-h-0 [&_[data-slot=input]]:pl-8 [&_[data-slot=input]]:text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="xs"
                className={cn(
                  "h-8 gap-1.5 px-2.5 text-xs",
                  hideDone && "border-primary/60 text-primary",
                )}
                onClick={() => setHideDone((current) => !current)}
                aria-pressed={hideDone}
              >
                {hideDone ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                {hideDone
                  ? t("workspace:gantt.showDone")
                  : t("workspace:gantt.hideDone")}
              </Button>

              <Button
                variant="outline"
                size="xs"
                className="h-8 gap-1.5 px-2.5 text-xs"
                onClick={scrollToToday}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {t("workspace:gantt.today")}
              </Button>

              <div className="flex items-center rounded-md border border-border">
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-8 w-8 rounded-r-none border-r border-border p-0"
                  onClick={zoomOut}
                  disabled={dayColumnWidthRem <= MIN_DAY_WIDTH}
                  aria-label={t("workspace:gantt.zoomOut")}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-10 text-center text-[11px] tabular-nums text-muted-foreground">
                  {Math.round(
                    (dayColumnWidthRem / DEFAULT_DAY_WIDTH_DESKTOP) * 100,
                  )}
                  %
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-8 w-8 rounded-l-none border-l border-border p-0"
                  onClick={zoomIn}
                  disabled={dayColumnWidthRem >= MAX_DAY_WIDTH}
                  aria-label={t("workspace:gantt.zoomIn")}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="xs"
                className="min-h-11 touch-manipulation sm:hidden"
                onClick={() => setIsTaskRailOpen((current) => !current)}
              >
                {showTaskRail
                  ? t("workspace:gantt.hideTasks")
                  : t("workspace:gantt.showTasks")}
              </Button>
            </div>
          </div>
        </div>

        {!timeline || parsedTasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="max-w-sm text-center">
              <h2 className="text-sm font-semibold text-foreground">
                {t("workspace:gantt.noTasks")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("workspace:gantt.noTasksSubtitle")}
              </p>
            </div>
          </div>
        ) : scheduledTasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="max-w-sm text-center">
              <h2 className="text-sm font-semibold text-foreground">
                {t("workspace:gantt.noTasksFound")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("workspace:gantt.noTasksMatch", { query: searchQuery })}
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="min-h-0 flex-1 overflow-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"
          >
            <div
              className={cn(
                "relative min-w-max touch-pan-x touch-pan-y select-none",
                isScrollDragging ? "cursor-grabbing" : "cursor-grab",
              )}
              onPointerDown={handlePointerDownForScroll}
            >
              <div className="sticky top-0 z-20 flex border-b border-border bg-background/95 backdrop-blur">
                {showTaskRail ? (
                  <div
                    className="sticky left-0 z-30 shrink-0 cursor-auto border-r border-border bg-background px-2 py-2.5 sm:w-80 sm:px-4 sm:py-3"
                    style={{
                      width: isMobile ? `${taskColumnWidthRem}rem` : undefined,
                    }}
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("workspace:gantt.taskHeader")}
                    </p>
                  </div>
                ) : null}
                <div
                  className="grid shrink-0"
                  style={{
                    gridTemplateColumns: timeline.gridTemplateColumns,
                    minWidth: `${timeline.timelineMinWidthRem}rem`,
                  }}
                >
                  {timeline.days.map((day, index) => {
                    const showMonth =
                      index === 0 ||
                      !isSameMonth(day, timeline.days[index - 1] ?? day);

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "border-r border-border/70 px-0.5 py-2 text-center sm:px-1",
                          isWeekend(day) && "bg-muted/25",
                        )}
                      >
                        <div className="h-4 text-[10px] font-medium text-muted-foreground">
                          {showMonth ? format(day, "MMM") : ""}
                        </div>
                        <div
                          className={cn(
                            "mx-auto flex size-6 items-center justify-center rounded-full text-xs font-medium",
                            isToday(day) &&
                              "bg-primary text-primary-foreground",
                          )}
                        >
                          {format(day, "d")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative">
                <div
                  ref={timelineTrackRef}
                  className="absolute inset-y-0 z-0 grid"
                  style={{
                    left: showTaskRail
                      ? isMobile
                        ? `${taskColumnWidthRem}rem`
                        : "20rem"
                      : "0rem",
                    gridTemplateColumns: timeline.gridTemplateColumns,
                    width: `${timeline.timelineMinWidthRem}rem`,
                  }}
                >
                  {timeline.days.map((day) => (
                    <div
                      key={`bg-line-${day.toISOString()}`}
                      className={cn(
                        "h-full min-h-0 border-r border-border/60",
                        isWeekend(day) && "bg-muted/25",
                      )}
                    />
                  ))}
                </div>

                <div className="relative z-10 flex flex-col">
                  {scheduledTasks.map((task) => {
                    return (
                      <div
                        key={task.id}
                        className="grid items-stretch border-b border-border/70"
                        style={{
                          gridTemplateColumns: showTaskRail
                            ? isMobile
                              ? `${taskColumnWidthRem}rem max-content`
                              : "20rem max-content"
                            : "max-content",
                        }}
                      >
                        {showTaskRail ? (
                          <div className="sticky left-0 z-[11] h-full cursor-auto border-r border-border bg-background">
                            <button
                              type="button"
                              className="flex w-full min-w-0 flex-col items-start justify-center gap-0.5 px-2 py-1 text-left transition-colors hover:bg-muted sm:px-3"
                              style={{ minHeight: rowHeightPx }}
                              onClick={() =>
                                navigate({
                                  to: ".",
                                  search: {
                                    taskId: task.id,
                                    taskProjectId: task.projectId,
                                  },
                                  replace: true,
                                })
                              }
                            >
                              {!isCompactRow && (
                                <div className="flex w-full items-center gap-1.5">
                                  <span className="truncate rounded-full bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                                    {task.projectName}
                                  </span>
                                </div>
                              )}
                              <div className="flex w-full items-center gap-1.5">
                                {!isCompactRow && (
                                  <span className="max-w-[7rem] truncate rounded-full bg-secondary px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-secondary-foreground sm:max-w-none">
                                    {getStatusLabel(task.status)}
                                  </span>
                                )}
                                <span className="truncate text-[10px] text-muted-foreground">
                                  {task.projectSlug}-{task.number}
                                </span>
                              </div>
                              <p className="w-full line-clamp-1 text-xs font-medium leading-tight text-foreground">
                                {task.title}
                              </p>
                              {!isCompactRow && (
                                <p className="w-full truncate text-[11px] leading-tight text-muted-foreground">
                                  {format(task.scheduleStart, "MMM d")} -{" "}
                                  {format(task.scheduleEnd, "MMM d")}
                                  {task.assigneeName
                                    ? ` • ${task.assigneeName}`
                                    : ""}
                                </p>
                              )}
                            </button>
                          </div>
                        ) : null}

                        <div
                          className="relative shrink-0 select-none"
                          style={{
                            minHeight: rowHeightPx,
                            minWidth: `${timeline.timelineMinWidthRem}rem`,
                          }}
                        >
                          <GanttTaskBar
                            task={task}
                            timeline={timeline}
                            pixelsPerDay={pixelsPerDay}
                            isMobile={isMobile}
                            barHeight={barHeightPx}
                            onOpenTask={() =>
                              navigate({
                                to: ".",
                                search: {
                                  taskId: task.id,
                                  taskProjectId: task.projectId,
                                },
                                replace: true,
                              })
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {taskId && taskProjectId ? (
          <TaskDetailsSheet
            taskId={taskId}
            projectId={taskProjectId}
            workspaceId={workspaceId}
            onClose={() =>
              navigate({
                to: ".",
                search: {},
                replace: true,
              })
            }
          />
        ) : null}
      </div>
    </WorkspaceLayout>
  );
}
