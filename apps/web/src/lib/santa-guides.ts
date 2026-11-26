/**
 * SEO content for the Secret Santa pages (/secret-santa and /secret-santa/[guide]).
 * Plain data so pages stay static and each guide targets its own searches.
 */

export type Faq = { q: string; a: string };
export type Guide = {
  slug: string;
  /** <title> (≈ 60 chars) */
  title: string;
  /** meta description (≈ 155 chars) */
  description: string;
  h1: string;
  intro: string;
  sections: { h2: string; paragraphs: string[]; list?: string[] }[];
  faq: Faq[];
};

export const MAIN_FAQ: Faq[] = [
  {
    q: "Comment faire un Secret Santa en ligne ?",
    a: "Créez votre Secret Santa sur Envly, partagez le lien d'invitation (WhatsApp, SMS, e-mail), puis lancez le tirage quand tout le monde a rejoint. Chacun découvre à qui il offre, sans que personne d'autre ne voie les paires, pas même l'organisateur.",
  },
  {
    q: "Le tirage au sort est-il vraiment gratuit ?",
    a: "Oui. Le Secret Santa d'Envly est gratuit, sans publicité et sans limite de participants raisonnable. Il faut seulement un compte (e-mail ou Google) pour que chacun retrouve sa personne et sa liste.",
  },
  {
    q: "Peut-on empêcher deux personnes de se tirer au sort ?",
    a: "Oui : l'organisateur ajoute des exclusions (un couple, des frères et sœurs…). Le tirage en tient compte automatiquement. Et personne ne se tire soi-même.",
  },
  {
    q: "Comment savoir quoi offrir à la personne tirée ?",
    a: "Chaque participant partage une liste d'envies, visible uniquement par la personne qui lui offre un cadeau. Vous pouvez aussi lui poser une question anonyme (taille, couleur préférée…) directement dans l'app.",
  },
  {
    q: "Quel budget fixer pour un Secret Santa ?",
    a: "Entre 10 et 30 € dans la plupart des groupes : 10 à 20 € entre collègues, 20 à 50 € en famille ou entre amis proches. L'organisateur l'indique à la création, il s'affiche pour tout le monde.",
  },
  {
    q: "Faut-il être tous au même endroit ?",
    a: "Non. Tout se passe en ligne : invitation, tirage, liste d'envies. Idéal pour une famille éparpillée ou une équipe en télétravail, il suffit d'envoyer le cadeau par la poste.",
  },
];

export const GUIDES: Guide[] = [
  {
    slug: "bureau",
    title: "Secret Santa au bureau : organiser le tirage entre collègues",
    description:
      "Organisez un Secret Santa au travail en 5 minutes : tirage au sort en ligne, budget, exclusions, idées de cadeaux entre collègues. Gratuit, sans publicité.",
    h1: "Organiser un Secret Santa au bureau",
    intro:
      "Le Secret Santa est le rituel de fin d'année préféré des équipes : un seul cadeau chacun, un petit budget, et beaucoup de bonne humeur. Voici comment l'organiser sans tableur ni papiers dans un bonnet.",
    sections: [
      {
        h2: "Les étapes, de l'invitation à la remise des cadeaux",
        paragraphs: ["Comptez cinq minutes pour l'organisateur, une minute pour chaque collègue."],
        list: [
          "Créez le Secret Santa avec un nom (« Équipe Marketing 2026 »), un budget et la date de l'échange.",
          "Partagez le lien d'invitation sur Slack, Teams ou par e-mail.",
          "Chaque collègue rejoint et ajoute quelques idées à sa liste (ou laisse carte blanche).",
          "Lancez le tirage : chacun reçoit une notification et découvre à qui il offre.",
          "Le jour J, organisez la remise autour d'un café ou d'un déjeuner d'équipe.",
        ],
      },
      {
        h2: "Quel budget pour un Secret Santa entre collègues ?",
        paragraphs: [
          "Restez simple : 10 à 20 € conviennent à tout le monde, y compris aux alternants et stagiaires. Un budget annoncé dès l'invitation évite les écarts gênants le jour de l'échange.",
          "Besoin d'inspiration ? Nos idées cadeaux à moins de 20 € sont triées parmi les produits les plus ajoutés aux listes Envly.",
        ],
      },
      {
        h2: "Les règles d'or au travail",
        paragraphs: ["Quelques règles évitent les malaises :"],
        list: [
          "Pas de cadeau trop personnel (parfum, vêtements) sauf si la liste le demande.",
          "Pas de blague qui pourrait mettre quelqu'un mal à l'aise.",
          "Participation libre : personne ne doit se sentir obligé.",
          "Prévoir une solution pour les absents (envoi ou remise au retour).",
        ],
      },
    ],
    faq: [
      {
        q: "Un manager peut-il participer ?",
        a: "Bien sûr, et c'est souvent apprécié. Le tirage est aléatoire : un manager peut offrir à n'importe qui, et inversement. Gardez simplement le même budget pour tout le monde.",
      },
      {
        q: "Et si l'équipe est en télétravail ?",
        a: "Le tirage et les listes sont en ligne. Chacun commande le cadeau en livraison directe chez son collègue, ou l'échange a lieu lors du prochain jour au bureau.",
      },
    ],
  },
  {
    slug: "famille",
    title: "Secret Santa en famille : un seul cadeau chacun à Noël",
    description:
      "Remplacez la montagne de cadeaux par un Secret Santa familial : tirage au sort en ligne, exclusions pour les couples, listes d'envies. Gratuit.",
    h1: "Un Secret Santa en famille pour Noël",
    intro:
      "Quand la famille s'agrandit, offrir un cadeau à chacun devient vite un casse-tête (et un budget). Le Secret Santa familial règle tout : chacun offre un seul beau cadeau, choisi dans la liste de la personne tirée.",
    sections: [
      {
        h2: "Pourquoi passer au Secret Santa en famille",
        paragraphs: [
          "Moins de dépenses, moins de courses de dernière minute, et des cadeaux qui font vraiment plaisir puisqu'ils viennent d'une liste d'envies. Les enfants peuvent garder leurs cadeaux habituels à côté.",
        ],
      },
      {
        h2: "Éviter que les couples se tirent entre eux",
        paragraphs: [
          "Avec les exclusions, l'organisateur indique les paires à éviter : conjoints, frères et sœurs qui s'offrent déjà quelque chose… Le tirage en tient compte. Personne ne se tire lui-même et deux personnes ne s'échangent jamais simplement leurs cadeaux.",
        ],
      },
      {
        h2: "Les listes d'envies, la fin des cadeaux ratés",
        paragraphs: [
          "Chaque participant ajoute ses envies depuis n'importe quelle boutique. Seule la personne qui lui offre un cadeau voit sa liste. Elle peut même lui poser une question anonyme : « Tu fais quelle pointure ? »",
        ],
      },
    ],
    faq: [
      {
        q: "Les grands-parents sans smartphone peuvent-ils participer ?",
        a: "Oui : un proche peut créer leur compte et gérer leur liste avec eux. Le site fonctionne aussi sur ordinateur.",
      },
      {
        q: "À partir de combien de personnes ?",
        a: "Le tirage demande au moins 3 participants. Au-delà, pas de limite pratique : grandes tablées et familles recomposées bienvenues.",
      },
    ],
  },
  {
    slug: "a-distance",
    title: "Secret Santa à distance : le tirage au sort en ligne",
    description:
      "Famille éloignée, amis à l'étranger, équipe en télétravail : organisez un Secret Santa à distance avec tirage en ligne et listes d'envies. Gratuit.",
    h1: "Un Secret Santa à distance, simplement",
    intro:
      "Plus besoin d'être réunis pour tirer au sort. Avec un tirage en ligne, chacun rejoint depuis son téléphone, découvre sa personne et commande un cadeau livré directement chez elle.",
    sections: [
      {
        h2: "Comment ça marche",
        paragraphs: [],
        list: [
          "L'organisateur crée le Secret Santa et partage le lien.",
          "Chacun rejoint et choisit la liste que verra son Secret Santa.",
          "Le tirage est lancé en un clic, tout le monde est notifié.",
          "Chacun commande dans la liste de sa personne et fait livrer chez elle.",
        ],
      },
      {
        h2: "Penser à la livraison",
        paragraphs: [
          "Fixez une date d'échange réaliste (une visio par exemple) et laissez une à deux semaines pour les livraisons. Une question anonyme dans l'app permet de vérifier l'adresse ou la disponibilité sans dévoiler qui offre.",
        ],
      },
    ],
    faq: [
      {
        q: "Peut-on faire la révélation en visio ?",
        a: "Oui, c'est même une très bonne idée : chacun ouvre son cadeau devant la caméra et tente de deviner qui le lui a offert.",
      },
    ],
  },
  {
    slug: "regles",
    title: "Règles du Secret Santa : tout comprendre avant le tirage",
    description:
      "Les règles du Secret Santa expliquées simplement : tirage au sort, secret, budget, liste d'envies, révélation. Et comment l'organiser en ligne gratuitement.",
    h1: "Les règles du Secret Santa",
    intro:
      "Le principe tient en une phrase : chaque participant offre un cadeau à une personne tirée au sort, en secret. Voici les règles classiques, et celles qu'on ajoute souvent.",
    sections: [
      {
        h2: "Les règles de base",
        paragraphs: [],
        list: [
          "Chaque participant est tiré au sort et offre un cadeau à une seule personne.",
          "Personne ne se tire soi-même.",
          "On garde le secret jusqu'à l'échange (d'où le nom).",
          "Tout le monde respecte le même budget.",
          "Les cadeaux sont échangés le même jour.",
        ],
      },
      {
        h2: "Les variantes populaires",
        paragraphs: [],
        list: [
          "Thème imposé : fait main, livre, local, seconde main…",
          "Exclusions : les couples ne se tirent pas entre eux.",
          "Devinette : chacun doit deviner qui lui a offert son cadeau.",
          "Liste d'envies : chacun donne quelques idées pour éviter les cadeaux ratés.",
        ],
      },
      {
        h2: "Et si quelqu'un révèle son nom ?",
        paragraphs: [
          "Le tirage en ligne limite les fuites : personne, même l'organisateur, ne voit les autres paires. Seul chaque participant connaît la personne à qui il offre.",
        ],
      },
    ],
    faq: [
      {
        q: "Quelle différence entre Secret Santa et Père Noël secret ?",
        a: "Aucune : « Secret Santa » est le nom anglais du Père Noël secret (on dit aussi « Noël canadien » ou « Kris Kringle »). Les règles sont les mêmes.",
      },
    ],
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);

export const faqLd = (faq: Faq[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});
