import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PublicCollectionView } from "@/components/public-collection-view";

export default async function PublicWishlistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      wishes: {
        include: { reservation: true },
        orderBy: { createdAt: "desc" },
      },
      user: { select: { id: true, name: true } },
    },
  });

  if (!collection || !collection.isPublic) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.id === collection.userId;

  // Key privacy logic: strip reservation data for the owner
  const wishes = collection.wishes.map((wish) => ({
    id: wish.id,
    title: wish.title,
    description: wish.description,
    url: wish.url,
    imageUrl: wish.imageUrl,
    price: wish.price,
    reservation: isOwner ? null : wish.reservation,
  }));

  return (
    <PublicCollectionView
      collection={{
        name: collection.name,
        description: collection.description,
        ownerName: collection.user.name,
      }}
      wishes={wishes}
      isOwner={isOwner}
    />
  );
}
