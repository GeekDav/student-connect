export type MicroEvent = {
  id: string;
  title: string;
  description: string;
  author: string;
  whenLabel: string;
  where: string;
  spotsTotal: number;
  spotsTaken: number;
  joined: boolean;
};

export const INITIAL_EVENTS: MicroEvent[] = [
  {
    id: "e1",
    title: "Tournoi FIFA chambre 302",
    description:
      "Petit tournoi ce soir, manettes fournies. Ambiance cool, tous niveaux.",
    author: "Léa M.",
    whenLabel: "Aujourd’hui · 20h",
    where: "Chambre 302 / salon étage",
    spotsTotal: 6,
    spotsTaken: 3,
    joined: false,
  },
  {
    id: "e2",
    title: "Verre en terrasse",
    description: "Qui est partant pour un verre près de la résidence ?",
    author: "Nina R.",
    whenLabel: "Ce soir · 19h",
    where: "Devant le hall A",
    spotsTotal: 8,
    spotsTaken: 2,
    joined: false,
  },
  {
    id: "e3",
    title: "Session révision droit",
    description: "Révisions ouvertes pour le partiel de demain. Amenez vos fiches.",
    author: "Fatou S.",
    whenLabel: "Demain · 14h",
    where: "Salle commune RDC",
    spotsTotal: 5,
    spotsTaken: 5,
    joined: false,
  },
  {
    id: "e4",
    title: "Foot au city stade",
    description: "Match amical 5v5. Crédit photo après si on marque.",
    author: "Amadou D.",
    whenLabel: "Samedi · 16h",
    where: "City stade à 10 min",
    spotsTotal: 10,
    spotsTaken: 7,
    joined: true,
  },
];
