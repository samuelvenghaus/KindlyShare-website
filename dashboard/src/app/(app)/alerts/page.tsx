import { Bell, CheckCircle2 } from "lucide-react";
import { PageHeader, DateRangeButton, UserMenu } from "@/components/layout/HeaderWidgets";
import { Card, CardHeader } from "@/components/ui/Card";
import { PriorityBadge } from "@/components/ui/Badge";
import { AssigneeSelect } from "@/components/ui/AssigneeSelect";
import { getSession } from "@/lib/auth";
import { listAlerts } from "@/lib/data/alerts";
import { getTeamMembers } from "@/lib/data/team";
import { formatTimeAgo, minutesSince } from "@/lib/dummy-data";
import { resolveAlertAction } from "@/lib/actions/alert-actions";
import { assignAlertAction } from "@/lib/actions/assignment-actions";

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
            <Card key={alert.id} className={alert.resolved ? "opacity-60" : undefined}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardHeader
                    title={alert.topicLabel}
                    subtitle={`${alert.increasePercentage}% toename in ${alert.windowDays} dagen · ${alert.reviewCount} reviews · ${formatTimeAgo(minutesSince(alert.createdAt))}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {alert.resolved ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-positive-bg px-3 py-1 text-xs font-semibold text-positive">
                      <CheckCircle2 size={13} /> Opgelost
                    </span>
                  ) : (
                    <PriorityBadge priority={alert.priority} />
                  )}
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

              {!alert.resolved && (
                <form action={resolveAlertAction} className="mt-4">
                  <input type="hidden" name="alertId" value={alert.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface"
                  >
                    Markeer als opgelost
                  </button>
                </form>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
