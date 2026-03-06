import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes } from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function cuid() {
  return randomBytes(12).toString("hex");
}

function slug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    randomBytes(3).toString("hex")
  );
}

const USERS = [
  {
    name: "Alice Martin",
    email: "alice.martin@example.com",
    slug: "alice-martin",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alice",
    collections: [
      {
        name: "Tech Gadgets",
        wishes: [
          { title: "AirPods Pro 3", price: 279, url: "https://apple.com/airpods-pro", imageUrl: "https://picsum.photos/seed/airpods/400/400" },
          { title: "Kindle Paperwhite", price: 149, url: "https://amazon.fr/kindle", imageUrl: "https://picsum.photos/seed/kindle/400/400" },
          { title: "Raspberry Pi 5", price: 89, url: "https://raspberrypi.com", imageUrl: "https://picsum.photos/seed/raspi/400/400" },
        ],
      },
      {
        name: "Kitchen Essentials",
        wishes: [
          { title: "KitchenAid Artisan", price: 499, imageUrl: "https://picsum.photos/seed/kitchenaid/400/400" },
          { title: "Le Creuset Dutch Oven", price: 350, imageUrl: "https://picsum.photos/seed/lecreuset/400/400" },
          { title: "Nespresso Vertuo", price: 199, imageUrl: "https://picsum.photos/seed/nespresso/400/400" },
        ],
      },
      {
        name: "Books to Read",
        wishes: [
          { title: "Dune - Frank Herbert", price: 12, imageUrl: "https://picsum.photos/seed/dune/400/400" },
          { title: "Clean Code - Robert Martin", price: 35, imageUrl: "https://picsum.photos/seed/cleancode/400/400" },
          { title: "Sapiens - Yuval Harari", price: 15, imageUrl: "https://picsum.photos/seed/sapiens/400/400" },
        ],
      },
      {
        name: "Gaming",
        wishes: [
          { title: "PS5 DualSense Edge", price: 219, imageUrl: "https://picsum.photos/seed/dualsense/400/400" },
          { title: "Zelda Tears of the Kingdom", price: 59, imageUrl: "https://picsum.photos/seed/zelda/400/400" },
          { title: "SteelSeries Arctis Nova Pro", price: 349, imageUrl: "https://picsum.photos/seed/steelseries/400/400" },
        ],
      },
      {
        name: "Fitness",
        wishes: [
          { title: "Apple Watch Ultra 2", price: 899, imageUrl: "https://picsum.photos/seed/applewatch/400/400" },
          { title: "Theragun Pro", price: 549, imageUrl: "https://picsum.photos/seed/theragun/400/400" },
          { title: "Lululemon Yoga Mat", price: 89, imageUrl: "https://picsum.photos/seed/yogamat/400/400" },
        ],
      },
      {
        name: "Travel Gear",
        wishes: [
          { title: "Peak Design Travel Backpack", price: 299, imageUrl: "https://picsum.photos/seed/peakdesign/400/400" },
          { title: "Sony WH-1000XM5", price: 379, imageUrl: "https://picsum.photos/seed/sonyxm5/400/400" },
          { title: "Anker PowerCore 26800", price: 65, imageUrl: "https://picsum.photos/seed/anker/400/400" },
        ],
      },
    ],
  },
  {
    name: "Lucas Dupont",
    email: "lucas.dupont@example.com",
    slug: "lucas-dupont",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Lucas",
    collections: [
      {
        name: "Sneakers",
        wishes: [
          { title: "Nike Air Max 90", price: 139, imageUrl: "https://picsum.photos/seed/airmax/400/400" },
          { title: "New Balance 550", price: 119, imageUrl: "https://picsum.photos/seed/nb550/400/400" },
          { title: "Adidas Samba OG", price: 100, imageUrl: "https://picsum.photos/seed/samba/400/400" },
        ],
      },
      {
        name: "Vinyl Records",
        wishes: [
          { title: "Random Access Memories - Daft Punk", price: 35, imageUrl: "https://picsum.photos/seed/daftpunk/400/400" },
          { title: "OK Computer - Radiohead", price: 28, imageUrl: "https://picsum.photos/seed/radiohead/400/400" },
          { title: "To Pimp a Butterfly - Kendrick", price: 32, imageUrl: "https://picsum.photos/seed/kendrick/400/400" },
        ],
      },
      {
        name: "Photography",
        wishes: [
          { title: "Fujifilm X-T5", price: 1699, imageUrl: "https://picsum.photos/seed/fuji/400/400" },
          { title: "Peak Design Slide Strap", price: 64, imageUrl: "https://picsum.photos/seed/slide/400/400" },
          { title: "SanDisk Extreme Pro 256GB", price: 45, imageUrl: "https://picsum.photos/seed/sdcard/400/400" },
        ],
      },
      {
        name: "Home Office",
        wishes: [
          { title: "Herman Miller Aeron", price: 1395, imageUrl: "https://picsum.photos/seed/aeron/400/400" },
          { title: "LG UltraFine 5K", price: 1299, imageUrl: "https://picsum.photos/seed/lg5k/400/400" },
          { title: "Logitech MX Master 3S", price: 99, imageUrl: "https://picsum.photos/seed/mxmaster/400/400" },
        ],
      },
      {
        name: "Board Games",
        wishes: [
          { title: "Wingspan", price: 55, imageUrl: "https://picsum.photos/seed/wingspan/400/400" },
          { title: "Terraforming Mars", price: 60, imageUrl: "https://picsum.photos/seed/terraform/400/400" },
          { title: "7 Wonders Duel", price: 25, imageUrl: "https://picsum.photos/seed/7wonders/400/400" },
        ],
      },
      {
        name: "Coffee Corner",
        wishes: [
          { title: "Comandante C40 Grinder", price: 279, imageUrl: "https://picsum.photos/seed/comandante/400/400" },
          { title: "Fellow Stagg EKG Kettle", price: 165, imageUrl: "https://picsum.photos/seed/stagg/400/400" },
          { title: "AeroPress Clear", price: 39, imageUrl: "https://picsum.photos/seed/aeropress/400/400" },
        ],
      },
    ],
  },
  {
    name: "Emma Bernard",
    email: "emma.bernard@example.com",
    slug: "emma-bernard",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Emma",
    collections: [
      {
        name: "Skincare",
        wishes: [
          { title: "Drunk Elephant Protini", price: 68, imageUrl: "https://picsum.photos/seed/protini/400/400" },
          { title: "La Roche-Posay SPF50", price: 18, imageUrl: "https://picsum.photos/seed/spf50/400/400" },
          { title: "Paula's Choice BHA", price: 32, imageUrl: "https://picsum.photos/seed/bha/400/400" },
        ],
      },
      {
        name: "Jewelry",
        wishes: [
          { title: "Mejuri Bold Hoops", price: 78, imageUrl: "https://picsum.photos/seed/hoops/400/400" },
          { title: "Monica Vinader Ring", price: 150, imageUrl: "https://picsum.photos/seed/mvring/400/400" },
          { title: "Missoma Chain Necklace", price: 120, imageUrl: "https://picsum.photos/seed/missoma/400/400" },
        ],
      },
      {
        name: "Plants",
        wishes: [
          { title: "Monstera Deliciosa", price: 35, imageUrl: "https://picsum.photos/seed/monstera/400/400" },
          { title: "Ceramic Planter Set", price: 55, imageUrl: "https://picsum.photos/seed/planter/400/400" },
          { title: "Plant Care Toolkit", price: 29, imageUrl: "https://picsum.photos/seed/plantkit/400/400" },
        ],
      },
      {
        name: "Stationery",
        wishes: [
          { title: "Leuchtturm1917 Notebook", price: 22, imageUrl: "https://picsum.photos/seed/leuchtturm/400/400" },
          { title: "Lamy Safari Fountain Pen", price: 28, imageUrl: "https://picsum.photos/seed/lamy/400/400" },
          { title: "Tombow Brush Pens Set", price: 35, imageUrl: "https://picsum.photos/seed/tombow/400/400" },
        ],
      },
      {
        name: "Yoga & Wellness",
        wishes: [
          { title: "Manduka PRO Mat", price: 120, imageUrl: "https://picsum.photos/seed/manduka/400/400" },
          { title: "Liforme Alignment Mat", price: 140, imageUrl: "https://picsum.photos/seed/liforme/400/400" },
          { title: "Yoga Bolster Cushion", price: 45, imageUrl: "https://picsum.photos/seed/bolster/400/400" },
        ],
      },
      {
        name: "Candles & Home",
        wishes: [
          { title: "Diptyque Baies Candle", price: 68, imageUrl: "https://picsum.photos/seed/diptyque/400/400" },
          { title: "Boy Smells Cedar Stack", price: 39, imageUrl: "https://picsum.photos/seed/boysmells/400/400" },
          { title: "Vitruvi Stone Diffuser", price: 119, imageUrl: "https://picsum.photos/seed/vitruvi/400/400" },
        ],
      },
    ],
  },
  {
    name: "Thomas Moreau",
    email: "thomas.moreau@example.com",
    slug: "thomas-moreau",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Thomas",
    collections: [
      {
        name: "Cycling",
        wishes: [
          { title: "Garmin Edge 840", price: 449, imageUrl: "https://picsum.photos/seed/garmin840/400/400" },
          { title: "Rapha Core Jersey", price: 90, imageUrl: "https://picsum.photos/seed/rapha/400/400" },
          { title: "Continental GP5000", price: 65, imageUrl: "https://picsum.photos/seed/gp5000/400/400" },
        ],
      },
      {
        name: "Cooking",
        wishes: [
          { title: "Staub Cocotte 28cm", price: 299, imageUrl: "https://picsum.photos/seed/staub/400/400" },
          { title: "Microplane Grater", price: 15, imageUrl: "https://picsum.photos/seed/microplane/400/400" },
          { title: "Thermapen One", price: 99, imageUrl: "https://picsum.photos/seed/thermapen/400/400" },
        ],
      },
      {
        name: "Watches",
        wishes: [
          { title: "Seiko Presage Cocktail", price: 450, imageUrl: "https://picsum.photos/seed/seiko/400/400" },
          { title: "Casio G-Shock CasiOak", price: 110, imageUrl: "https://picsum.photos/seed/gshock/400/400" },
          { title: "Orient Bambino V2", price: 220, imageUrl: "https://picsum.photos/seed/orient/400/400" },
        ],
      },
      {
        name: "Camping",
        wishes: [
          { title: "MSR Hubba Hubba NX", price: 450, imageUrl: "https://picsum.photos/seed/msr/400/400" },
          { title: "Jetboil Flash", price: 119, imageUrl: "https://picsum.photos/seed/jetboil/400/400" },
          { title: "Nemo Tensor Insulated", price: 199, imageUrl: "https://picsum.photos/seed/nemo/400/400" },
        ],
      },
      {
        name: "Whisky",
        wishes: [
          { title: "Lagavulin 16 ans", price: 65, imageUrl: "https://picsum.photos/seed/lagavulin/400/400" },
          { title: "Glencairn Glass Set", price: 25, imageUrl: "https://picsum.photos/seed/glencairn/400/400" },
          { title: "Talisker 10 ans", price: 42, imageUrl: "https://picsum.photos/seed/talisker/400/400" },
        ],
      },
      {
        name: "DIY Tools",
        wishes: [
          { title: "Makita Impact Driver", price: 189, imageUrl: "https://picsum.photos/seed/makita/400/400" },
          { title: "Bosch Laser Level", price: 99, imageUrl: "https://picsum.photos/seed/boschlaser/400/400" },
          { title: "Stanley FatMax Tape", price: 18, imageUrl: "https://picsum.photos/seed/stanley/400/400" },
        ],
      },
    ],
  },
  {
    name: "Chloé Petit",
    email: "chloe.petit@example.com",
    slug: "chloe-petit",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Chloe",
    collections: [
      {
        name: "Fashion",
        wishes: [
          { title: "Sézane Gaspard Cardigan", price: 130, imageUrl: "https://picsum.photos/seed/sezane/400/400" },
          { title: "Veja Campo Sneakers", price: 150, imageUrl: "https://picsum.photos/seed/veja/400/400" },
          { title: "A.P.C. Half-Moon Bag", price: 390, imageUrl: "https://picsum.photos/seed/apc/400/400" },
        ],
      },
      {
        name: "Art Supplies",
        wishes: [
          { title: "Winsor & Newton Watercolors", price: 55, imageUrl: "https://picsum.photos/seed/winsor/400/400" },
          { title: "Strathmore Toned Tan Pad", price: 12, imageUrl: "https://picsum.photos/seed/strathmore/400/400" },
          { title: "Prismacolor Premier Set", price: 48, imageUrl: "https://picsum.photos/seed/prismacolor/400/400" },
        ],
      },
      {
        name: "Baking",
        wishes: [
          { title: "Nordic Ware Bundt Pan", price: 35, imageUrl: "https://picsum.photos/seed/nordicware/400/400" },
          { title: "Silpat Baking Mat", price: 25, imageUrl: "https://picsum.photos/seed/silpat/400/400" },
          { title: "OXO Kitchen Scale", price: 55, imageUrl: "https://picsum.photos/seed/oxo/400/400" },
        ],
      },
      {
        name: "K-Drama Merch",
        wishes: [
          { title: "Goblin OST Vinyl", price: 40, imageUrl: "https://picsum.photos/seed/goblin/400/400" },
          { title: "Crash Landing Photobook", price: 35, imageUrl: "https://picsum.photos/seed/cloy/400/400" },
          { title: "Korean Snack Box", price: 30, imageUrl: "https://picsum.photos/seed/ksnack/400/400" },
        ],
      },
      {
        name: "Fragrance",
        wishes: [
          { title: "Maison Margiela Lazy Sunday", price: 130, imageUrl: "https://picsum.photos/seed/margiela/400/400" },
          { title: "Le Labo Santal 33", price: 190, imageUrl: "https://picsum.photos/seed/lelabo/400/400" },
          { title: "Byredo Gypsy Water", price: 165, imageUrl: "https://picsum.photos/seed/byredo/400/400" },
        ],
      },
      {
        name: "Puzzle Collection",
        wishes: [
          { title: "Ravensburger 1000pc Gradient", price: 18, imageUrl: "https://picsum.photos/seed/ravensburger/400/400" },
          { title: "Areaware Gradient Puzzle", price: 28, imageUrl: "https://picsum.photos/seed/areaware/400/400" },
          { title: "Cloudberries Planets 1000pc", price: 22, imageUrl: "https://picsum.photos/seed/cloudberries/400/400" },
        ],
      },
    ],
  },
];

async function main() {
  // Find the main user
  const mainUser = await prisma.user.findUnique({
    where: { email: "brdnicolas.contact@gmail.com" },
  });

  if (!mainUser) {
    console.error("User brdnicolas.contact@gmail.com not found!");
    process.exit(1);
  }

  console.log(`Found main user: ${mainUser.name} (${mainUser.id})`);

  for (const userData of USERS) {
    // Create user (upsert to be idempotent)
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name, image: userData.image, slug: userData.slug },
      create: {
        id: cuid(),
        name: userData.name,
        email: userData.email,
        slug: userData.slug,
        image: userData.image,
      },
    });

    console.log(`Created user: ${user.name}`);

    // Create 6 collections with 3 wishes each
    for (const colData of userData.collections) {
      const colSlug = slug(colData.name);

      const collection = await prisma.collection.create({
        data: {
          id: cuid(),
          name: colData.name,
          slug: colSlug,
          isPublic: true,
          userId: user.id,
        },
      });

      for (const wishData of colData.wishes) {
        await prisma.wish.create({
          data: {
            id: cuid(),
            title: wishData.title,
            price: wishData.price,
            url: wishData.url ?? null,
            imageUrl: wishData.imageUrl ?? null,
            collectionId: collection.id,
          },
        });
      }

      console.log(`  - Collection: ${colData.name} (${colData.wishes.length} wishes)`);
    }

    // Follow this user from main account
    await prisma.userFollow.upsert({
      where: {
        followerId_followingId: {
          followerId: mainUser.id,
          followingId: user.id,
        },
      },
      update: {},
      create: {
        id: cuid(),
        followerId: mainUser.id,
        followingId: user.id,
      },
    });

    console.log(`  -> Followed by ${mainUser.name}`);
  }

  console.log("\nDone! Created 5 users, 30 collections, 90 wishes, 5 follows.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
