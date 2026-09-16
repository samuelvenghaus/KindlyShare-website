import { Bell } from "lucide-react";
import clsx from "clsx";
import { PageHeader, DateRangeButton, UserMenu } from "@/components/layout/HeaderWidgets";
import { Card, CardHeader } from "@/components/ui/Card";
import { PriorityBadge } from "@/components/ui/Badge";
import { AssigneeSelect } from "@/components/ui/AssigneeSelect";
import { NotesSection } from "@/components/ui/NotesSection";
import { getSession } from "@/lib/auth";
import { listAlerts } from "@/lib/data/alerts";
import { getTeamMembers } from "@/lib/data/team";
import { formatTimeAgo, minutesSince, ALERT_STATUS_LABELS } from "@/lib/dummy-data";
import { updateAlertStatusAction } from "@/lib/actions/alert-actions";
import { assignAlertAction } from "@/lib/actions/assignment-actions";
import { addAlertNoteAction } from "@/lib/actions/note-actions";
import type { AlertStatus } from "@/lib/types";

const STATUS_OPTIONS: AlertStatus[] = ["open", "in_progress", "resolved"];

export default async function AlertsPage() {
  const session = await getSession();
  const [alerts, teamMembers] = session
    ? await Promise.all([listAlerts(session.companyId), getTeamMembers(session.companyId)])
    : [[], []];

  return (
    <>
      <PageHeader
        title="Alerts"
        subtitle="Problemen die AI signaleert op basis van je feedback."
        actions={
          <>
            <DateRangeButton />
            <UserMenu />
          </>
        }
      />

      {alerts.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-interest-bg text-interest">
            <Bell size={22} />
          </div>
          <p className="text-base font-semibold text-foreground">Nog geen alerts</p>
          <p className="max-w-sm text-sm text-muted">
            Zodra een onderwerp vaker dan normaal in probleem-feedback voorkomt, verschijnt hier een alert
            met een AI-oplossingssuggestie.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className={alert.status === "resolved" ? "opacity-60" : undefined}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardHeader
                    title={alert.topicLabel}
                    subtitle={`${alert.increasePercentage}% toename in ${alert.windowDays} dagen · ${alert.reviewCount} reviews · ${formatTimeAgo(minutesSince(alert.createdAt))}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={alert.priority} />
                  <AssigneeSelect
                    hiddenFieldName="alertId"
                    hiddenFieldValue={alert.id}
                    assignedToId={alert.assignedToId}
                    teamMembers={teamMembers}
                    action={assignAlertAction}
                  />
                </div>
              </div>

              {alert.aiSuggestion && (
                <div className="mt-3 rounded-xl border border-solution/30 bg-solution-bg p-4">
                  <p className="text-sm font-semibold text-solution">AI-oplossingssuggestie</p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/90">{alert.aiSuggestion}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <form key={status} action={updateAlertStatusAction}>
                    <input type="hidden" name="alertId" value={alert.id} />
                    <input type="hidden" name="status" value={status} />
                    <button
                      type="submit"
                      disabled={alert.status === status}
                      className={clsx(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium",
                        alert.status === status
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-border text-foreground hover:bg-surface"
                      )}
                    >
                      {ALERT_STATUS_LABELS[status]}
                    </button>
                  </form>
                ))}
              </div>

              <NotesSection
                notes={alert.notes}
                hiddenFieldName="alertId"
                hiddenFieldValue={alert.id}
                action={addAlertNoteAction}
              />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
