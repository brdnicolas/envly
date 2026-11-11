import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
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
      isPublic: true,
      user: { select: { name: true } },
      _count: { select: { wishes: true } },
      wishes: { select: { title: true }, orderBy: [{ isPriority: "desc" }, { createdAt: "desc" }], take: 3 },
    },
  });

  if (!collection) return {};
  // Private lists: no index, no details in previews.
  if (!collection.isPublic) return { title: "Liste privée", robots: { index: false, follow: false } };

  const owner = collection.user.name || "Quelqu’un";
  const n = collection._count.wishes;
  const picks = collection.wishes.map((w) => w.title.split(/[|–-]/)[0].trim()).filter(Boolean);
  const description =
    collection.description ||
    `La liste d’envies de ${owner} : ${n} idée${n > 1 ? "s" : ""} cadeau${picks.length ? ` (${picks.join(", ")}…)` : ""}. Réservez un cadeau en secret sur Envly.`;
  const title = `${collection.name} — la liste de ${owner}`;

  return {
    title,
    description: description.slice(0, 300),
    alternates: { canonical: `/w/${slug}` },
    openGraph: { type: "website", title, description: description.slice(0, 300), url: `/w/${slug}` },
    twitter: { card: "summary_large_image", title, description: description.slice(0, 200) },
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

  // Structured data: the list as an ItemList of products (rich results, Google Shopping signals).
  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: collection.name,
    url: `${SITE_URL}/w/${slug}`,
    numberOfItems: wishes.length,
    itemListElement: wishes.slice(0, 30).map((w, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: w.title,
        ...(w.imageUrl && { image: w.imageUrl }),
        ...(w.url && { url: w.url }),
        ...(w.price != null && { offers: { "@type": "Offer", price: w.price, priceCurrency: "EUR" } }),
      },
    })),
  };

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd).replace(/</g, "\\u003c") }} />
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
    </>
  );
}
