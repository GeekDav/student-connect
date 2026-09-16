export type MarketplaceItem = {
  id: string;
  title: string;
  description: string;
  author: string;
  timeLabel: string;
  type: "don" | "vente";
  priceLabel?: string;
  location: string;
  status: "available" | "reserved" | "gone";
  interested: boolean;
};

export const INITIAL_MARKETPLACE: MarketplaceItem[] = [
  {
    id: "m1",
    title: "Micro-ondes à donner",
    description: "Fonctionne parfaitement, je quitte la résidence fin du mois.",
    author: "Sophie T.",
    timeLabel: "Il y a 2 h",
    type: "don",
    location: "Hall A",
    status: "available",
    interested: false,
  },
  {
    id: "m2",
    title: "Chaise de bureau",
    description: "Bon état, réglable en hauteur. Idéale pour réviser.",
    author: "Thomas N.",
    timeLabel: "Il y a 5 h",
    type: "vente",
    priceLabel: "15 €",
    location: "Étage 2",
    status: "available",
    interested: false,
  },
  {
    id: "m3",
    title: "Livres de droit L1/L2",
    description: "Pack intro droit civil + constitutionnel. Annotations légères.",
    author: "Léa M.",
    timeLabel: "Hier",
    type: "don",
    location: "Salle commune",
    status: "reserved",
    interested: true,
  },
  {
    id: "m4",
    title: "Lampe de chevet",
    description: "Petite lampe LED, câble inclus.",
    author: "Hugo P.",
    timeLabel: "Il y a 2 jours",
    type: "vente",
    priceLabel: "8 €",
    location: "Hall B",
    status: "gone",
    interested: false,
  },
];
