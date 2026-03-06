"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WishCard } from "@/components/wish-card";
import { ReserveDialog } from "@/components/reserve-dialog";
import { MasonryGrid } from "@/components/masonry-grid";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/components/follow-button";
import { FollowedBy } from "@/components/followed-by";

interface FollowData {
  collectionId: string;
  initialFollowing: boolean;
  followers: { name: string | null; image: string | null }[];
  totalFollowers: number;
}

interface Wish {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  imageOriginalUrl?: string | null;
  price: number | null;
  isPriority?: boolean;
  reservation?: { reservedBy: string } | null;
}

export function PublicCollectionView({
  collection,
  wishes: initialWishes,
  isOwner,
  followData,
}: {
  collection: {
    name: string;
    description: string | null;
    ownerName: string | null;
    ownerSlug?: string | null;
  };
  wishes: Wish[];
  isOwner: boolean;
  followData?: FollowData;
}) {
  const [wishes, setWishes] = useState(initialWishes);
  const [reserveWish, setReserveWish] = useState<Wish | null>(null);

  const handleReserved = (wishId: string, reservedBy: string) => {
    setWishes((prev) =>
      prev.map((w) =>
        w.id === wishId ? { ...w, reservation: { reservedBy } } : w
      )
    );
  };

  const handleCancelReservation = (wishId: string) => {
    setWishes((prev) =>
      prev.map((w) =>
        w.id === wishId ? { ...w, reservation: null } : w
      )
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold">{collection.name}</h1>
            {isOwner && (
              <Badge variant="outline" className="text-xs">
                Your list
              </Badge>
            )}
          </div>
          {collection.description && (
            <p className="text-muted-foreground text-sm">{collection.description}</p>
          )}
          {collection.ownerName && !isOwner && (
            <p className="text-muted-foreground text-xs mt-1">
              by{" "}
              {collection.ownerSlug ? (
                <Link
                  href={`/u/${collection.ownerSlug}`}
                  className="font-medium text-foreground hover:underline underline-offset-4"
                >
                  {collection.ownerName}
                </Link>
              ) : (
                collection.ownerName
              )}
            </p>
          )}
          {followData && (
            <div className="flex items-center gap-3 mt-2">
              <FollowButton
                type="collection"
                targetId={followData.collectionId}
                initialFollowing={followData.initialFollowing}
              />
              {followData.totalFollowers > 0 && (
                <FollowedBy
                  followers={followData.followers}
                  totalCount={followData.totalFollowers}
                />
              )}
            </div>
          )}
        </div>

        {wishes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">This wishlist is empty</p>
          </div>
        ) : (
          <MasonryGrid>
            {wishes.map((wish) => (
              <WishCard
                key={wish.id}
                wish={wish}
                isOwner={isOwner}
                onReserve={(w) => setReserveWish(w)}
                onCancelReservation={handleCancelReservation}
              />
            ))}
          </MasonryGrid>
        )}

        <ReserveDialog
          wish={reserveWish}
          onOpenChange={(open) => !open && setReserveWish(null)}
          onReserved={handleReserved}
        />
      </main>
      <Footer />
    </div>
  );
}
