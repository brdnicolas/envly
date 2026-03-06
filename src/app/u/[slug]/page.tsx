import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FollowButton } from "@/components/follow-button";
import { FollowedBy } from "@/components/followed-by";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageIcon } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const user = await prisma.user.findUnique({
    where: { slug },
    select: { name: true, description: true, image: true },
  });

  if (!user) return {};

  const name = user.name || "User";

  return {
    title: `${name} - Envly`,
    description: user.description || `${name}'s profile on Envly`,
    openGraph: {
      title: name,
      description: user.description || `${name}'s profile on Envly`,
      ...(user.image ? { images: [{ url: user.image }] } : {}),
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      image: true,
      description: true,
      followers: {
        select: {
          follower: { select: { name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      _count: { select: { followers: true } },
      collections: {
        where: { isPublic: true },
        include: {
          _count: { select: { wishes: true } },
          wishes: {
            where: { imageUrl: { not: null } },
            select: { imageUrl: true },
            take: 6,
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const isOwn = session?.user?.id === user.id;

  let initialFollowing = false;
  if (session?.user?.id && !isOwn) {
    const existing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: user.id,
        },
      },
    });
    initialFollowing = !!existing;
  }

  const recentFollowers = user.followers.map((f) => f.follower);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex flex-col items-center text-center mb-10">
          <Avatar className="h-16 w-16 mb-3">
            {user.image ? <AvatarImage src={user.image} alt={user.name || ""} /> : null}
            <AvatarFallback className="text-xl">
              {user.name?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-semibold">{user.name || "Anonymous"}</h1>
          {user.description && (
            <p className="text-muted-foreground text-sm mt-1">{user.description}</p>
          )}
          <p className="text-muted-foreground text-sm mt-1">
            {user.collections.length} public collection{user.collections.length !== 1 ? "s" : ""}
          </p>
          {!isOwn && session && (
            <div className="mt-3">
              <FollowButton
                type="user"
                targetId={user.id}
                initialFollowing={initialFollowing}
              />
            </div>
          )}
          {user._count.followers > 0 && (
            <div className="mt-3">
              <FollowedBy
                followers={recentFollowers}
                totalCount={user._count.followers}
              />
            </div>
          )}
        </div>

        {user.collections.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No public collections yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.collections.map((collection) => {
              const images = collection.wishes
                .map((w) => w.imageUrl)
                .filter((url): url is string => !!url);

              return (
                <Link
                  key={collection.id}
                  href={`/w/${collection.slug}`}
                  className="group rounded-lg border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
                >
                  {images.length > 0 ? (
                    <div className="w-full aspect-[2/1] overflow-hidden grid grid-cols-3 grid-rows-2 gap-px bg-border">
                      {images.slice(0, 6).map((img, i) => (
                        <img key={i} src={img} alt="" className="w-full h-full object-cover" />
                      ))}
                      {Array.from({ length: Math.max(0, 6 - images.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-muted/30" />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full aspect-[2/1] bg-muted/30 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-medium group-hover:underline underline-offset-4">
                      {collection.name}
                    </h3>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                        {collection.description}
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground mt-2 block">
                      {collection._count.wishes} wish{collection._count.wishes !== 1 ? "es" : ""}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
