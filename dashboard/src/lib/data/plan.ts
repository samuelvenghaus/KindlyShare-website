import "server-only";
import { prisma } from "@/lib/prisma";
import type { Plan } from "@/lib/types";

export interface CompanyAccessStatus {
  plan: Plan | null;
  planActivatedAt: Date | null;
}

export async function getCompanyAccessStatus(companyId: string): Promise<CompanyAccessStatus> {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    select: { plan: true, planActivatedAt: true },
  });
  return company;
}
