export type User = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  slug: string | null;
  description?: string | null;
};

export type CollectionSummary = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isPublic: boolean;
  _count: { wishes: number };
  wishes: { imageUrl: string | null }[];
  role?: 'owner' | 'collaborator';
};

export type FriendCollection = CollectionSummary & {
  owner: { id: string; name: string | null; image: string | null; slug: string | null };
};

export type Wish = {
  id: string;
  url: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  isPriority: boolean;
  collectionId: string;
  creator?: { id: string; name: string | null } | null;
  /** Only sent to viewers (friends), never to the owner. */
  reservation?: { reservedBy: string } | null;
};

export type CollectionDetail = Omit<CollectionSummary, 'wishes' | 'role'> & {
  user: { id: string; name: string | null; image: string | null; slug?: string | null };
  wishes: Wish[];
  role: 'owner' | 'collaborator' | 'viewer';
};

export type ScrapeResult = {
  title: string;
  description: string;
  imageUrl: string;
  images: string[];
  price: number | null;
  currency: string | null;
};
