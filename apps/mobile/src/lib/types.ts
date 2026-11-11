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
  /** Photo size in pixels (null for old wishes): lets cards reserve the photo's space before it loads. */
  imageWidth?: number | null;
  imageHeight?: number | null;
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

export type Person = { id: string; name: string | null; image: string | null };

export type Santa = {
  id: string;
  name: string;
  budget: number | null;
  date: string | null;
  status: 'OPEN' | 'DRAWN';
  inviteCode: string;
  isOrganizer: boolean;
  organizer: Person;
  me: { status: 'INVITED' | 'JOINED'; collection: { id: string; name: string } | null } | null;
  members: (Person & { status: 'INVITED' | 'JOINED'; hasList: boolean })[];
  /** Only ever my own pairing. */
  assignment: { user: Person; collection: { id: string; name: string } | null } | null;
};

/** A wish from any of my lists (import picker). */
export type MyWish = {
  id: string;
  title: string;
  url: string | null;
  imageUrl: string | null;
  price: number | null;
  isPriority: boolean;
  collectionId: string;
  collection: { name: string };
};
