import { prisma } from "@/lib/prisma";

export async function getExhibitions() {
  return prisma.exhibition.findMany({
    orderBy: { startDate: "desc" },
  });
}
