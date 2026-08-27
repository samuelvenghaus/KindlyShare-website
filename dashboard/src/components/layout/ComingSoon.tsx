import type { LucideIcon } from "lucide-react";
import { PageHeader, DateRangeButton, UserMenu } from "@/components/layout/HeaderWidgets";
import { Card } from "@/components/ui/Card";

export function ComingSoon({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <>
      <PageHeader
        title={title}
        actions={
          <>
            <DateRangeButton />
            <UserMenu />
          </>
        }
      />
      <Card className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-interest-bg text-interest">
          <Icon size={22} />
        </div>
        <p className="text-base font-semibold text-foreground">Binnenkort beschikbaar</p>
        <p className="max-w-sm text-sm text-muted">{description}</p>
      </Card>
    </>
  );
}
