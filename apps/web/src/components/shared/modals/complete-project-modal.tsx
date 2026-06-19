import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import useCompleteProject from "@/hooks/mutations/project/use-complete-project";
import useCreateProjectValueEntry from "@/hooks/mutations/project/use-create-project-value-entry";
import { toast } from "@/lib/toast";

type ValueEntryDraft = {
  id: string;
  title: string;
  metric: string;
  category: "cost_savings" | "revenue" | "efficiency" | "quality" | "other";
  description: string;
};

type CompleteProjectModalProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  workspaceId: string;
};

const CATEGORIES = [
  { value: "cost_savings", label: "Cost Savings" },
  { value: "revenue", label: "Revenue" },
  { value: "efficiency", label: "Efficiency" },
  { value: "quality", label: "Quality" },
  { value: "other", label: "Other" },
] as const;

export function CompleteProjectModal({
  open,
  onClose,
  projectId,
  projectName,
  workspaceId,
}: CompleteProjectModalProps) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<ValueEntryDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: completeProject } = useCompleteProject({ workspaceId });
  const { mutateAsync: createValueEntry } = useCreateProjectValueEntry({
    projectId,
  });

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        title: "",
        metric: "",
        category: "other",
        description: "",
      },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntry = (
    id: string,
    field: keyof ValueEntryDraft,
    value: string,
  ) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const handleSubmit = async () => {
    const validEntries = entries.filter((e) => e.title.trim());
    if (entries.length > 0 && validEntries.length === 0) {
      toast.error(t("navigation:projectList.valueEntryTitleRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      await completeProject({ id: projectId });
      await Promise.all(
        validEntries.map((entry) =>
          createValueEntry({
            projectId,
            title: entry.title.trim(),
            category: entry.category,
            metric: entry.metric.trim() || undefined,
            description: entry.description.trim() || undefined,
          }),
        ),
      );
      toast.success(
        t("navigation:projectList.completedToast", { name: projectName }),
      );
      setEntries([]);
      onClose();
    } catch {
      toast.error(t("navigation:projectList.completeErrorToast"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEntries([]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden border-border bg-card shadow-2xl"
        showCloseButton={false}
      >
        <div className="p-8 pb-4">
          <div className="flex flex-col gap-6">
            <DialogHeader className="flex flex-row items-center gap-4 text-left space-y-0 p-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success/10 border border-success/20">
                <CheckCircle2 className="h-6 w-6 text-success-foreground" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                  {t("navigation:projectList.markComplete")}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  {projectName}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {t("navigation:projectList.valueEntriesLabel")}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={addEntry}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("navigation:projectList.addValueEntry")}
                </Button>
              </div>

              {entries.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("navigation:projectList.valueEntriesHint")}
                </p>
              )}

              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="space-y-2 border border-border rounded-md p-3 bg-sidebar"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {t("navigation:projectList.valueEntryNumber", {
                        number: index + 1,
                      })}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeEntry(entry.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Input
                        placeholder={t(
                          "navigation:projectList.valueEntryTitlePlaceholder",
                        )}
                        value={entry.title}
                        onChange={(e) =>
                          updateEntry(entry.id, "title", e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Select
                        value={entry.category}
                        onValueChange={(val) =>
                          updateEntry(entry.id, "category", val)
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        placeholder={t(
                          "navigation:projectList.valueEntryMetricPlaceholder",
                        )}
                        value={entry.metric}
                        onChange={(e) =>
                          updateEntry(entry.id, "metric", e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder={t(
                          "navigation:projectList.valueEntryDescPlaceholder",
                        )}
                        value={entry.description}
                        onChange={(e) =>
                          updateEntry(entry.id, "description", e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter className="px-8 py-5 flex flex-row justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground hover:bg-accent min-w-[80px]"
          >
            {t("common:actions.cancel")}
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="shadow-sm min-w-[120px] font-medium"
          >
            {isSubmitting
              ? t("navigation:projectList.completing")
              : t("navigation:projectList.markComplete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
