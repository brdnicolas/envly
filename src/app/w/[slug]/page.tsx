import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PublicCollectionView } from "@/components/public-collection-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await prisma.collection.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      user: { select: { name: true } },
      wishes: {
        where: { imageUrl: { not: null } },
        select: { imageUrl: true },
        take: 1,
      },
    },
  });

  if (!collection) return {};

  const ogImage = collection.wishes[0]?.imageUrl;
  const ownerName = collection.user.name || "Quelqu'un";

  return {
    title: `${collection.name} - Envly`,
    description: collection.description || `Wishlist de ${ownerName}`,
    openGraph: {
      title: collection.name,
      description: collection.description || `Wishlist de ${ownerName}`,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

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
        orderBy: [{ isPriority: "desc" }, { createdAt: "desc" }],
      },
      user: { select: { id: true, name: true, slug: true } },
      followers: {
        select: {
          user: { select: { name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      _count: { select: { followers: true } },
    },
  });

  if (!collection || !collection.isPublic) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.id === collection.userId;

  let isCollaborator = false;
  if (session?.user?.id && !isOwner) {
    const collab = await prisma.collectionCollaborator.findUnique({
      where: {
        collectionId_userId: {
          collectionId: collection.id,
          userId: session.user.id,
        },
      },
    });
    isCollaborator = collab?.status === "ACCEPTED";
  }

  let initialFollowing = false;
  if (session?.user?.id && !isOwner) {
    const existing = await prisma.collectionFollow.findUnique({
      where: {
        userId_collectionId: {
          userId: session.user.id,
          collectionId: collection.id,
        },
      },
    });
    initialFollowing = !!existing;
  }

  // Key privacy logic: strip reservation data for the owner
  const wishes = collection.wishes.map((wish) => ({
    id: wish.id,
    title: wish.title,
    description: wish.description,
    url: wish.url,
    imageUrl: wish.imageUrl,
    imageOriginalUrl: wish.imageOriginalUrl,
    price: wish.price,
    isPriority: wish.isPriority,
    reservation: isOwner || isCollaborator ? null : wish.reservation,
  }));

  const recentFollowers = collection.followers.map((f) => f.user);

  return (
    <PublicCollectionView
      collection={{
        name: collection.name,
        description: collection.description,
        ownerName: collection.user.name,
        ownerSlug: collection.user.slug,
      }}
      wishes={wishes}
      isOwner={isOwner}
      isCollaborator={isCollaborator}
      followData={
        session && !isOwner
          ? {
              collectionId: collection.id,
              initialFollowing,
              followers: recentFollowers,
              totalFollowers: collection._count.followers,
            }
          : undefined
      }
    />
  );
}
