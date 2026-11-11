import { prisma } from "@/lib/prisma";

export async function getCollectionAccess(
  collectionId: string,
  userId: string
): Promise<"owner" | "collaborator" | "none"> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: {
      userId: true,
      collaborators: {
        where: { userId, status: "ACCEPTED" },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!collection) return "none";
  if (collection.userId === userId) return "owner";
  if (collection.collaborators.length > 0) return "collaborator";
  return "none";
}
