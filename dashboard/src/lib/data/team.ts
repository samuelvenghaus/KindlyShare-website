import "server-only";
import { prisma } from "@/lib/prisma";

export interface TeamMember {
  id: string;
  name: string;
}

export async function getTeamMembers(companyId: string): Promise<TeamMember[]> {
  return prisma.user.findMany({
    where: { companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
