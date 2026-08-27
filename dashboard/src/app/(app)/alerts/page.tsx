import { Bell } from "lucide-react";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function AlertsPage() {
  return (
    <ComingSoon
      title="Alerts"
      icon={Bell}
      description="Een overzicht van alle probleemmeldingen en hun status komt hier in een latere fase."
    />
  );
}
