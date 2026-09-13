import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { WidgetFeedbackForm } from "@/components/widget/WidgetFeedbackForm";

// Bewust een compacte, op zichzelf staande lay-out (geen AuthShell/min-h-screen) - deze
// pagina wordt niet alleen los bezocht maar ook in een <iframe> op de website van het
// bedrijf ingebed, waar de content gewoon van boven naar beneden moet vloeien.
export default async function BeoordeelPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const company = await prisma.company.findUnique({ where: { widgetToken: token } });

  if (!company) {
    return (
      <div className="mx-auto max-w-sm px-4 py-8 text-center">
        <p className="text-sm text-muted">Deze feedbackwidget is niet (meer) beschikbaar.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-lg font-semibold text-foreground">Jouw ervaring bij {company.name}</h1>
        <p className="mt-1 text-sm text-muted">We zijn benieuwd naar je mening - het kost je maar een minuutje.</p>
        <div className="mt-5">
          <WidgetFeedbackForm companyToken={token} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        Feedback verzameld met
        <Image src="/logo.png" alt="KindlyShare" width={80} height={15} className="brand-logo h-3 w-auto" />
      </div>
    </div>
  );
}
