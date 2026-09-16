export type PartnerResidence = {
  id: string;
  name: string;
  city: string;
  operator: string;
};

/** Résidences partenaires (mock Phase Alpha — remplacé plus tard par la BDD). */
export const PARTNER_RESIDENCES: PartnerResidence[] = [
  {
    id: "studea-lille-euralille",
    name: "Nexity Studéa Lille Euralille",
    city: "Lille",
    operator: "Nexity Studéa",
  },
  {
    id: "estudines-paris-bercy",
    name: "Les Estudines Paris Bercy",
    city: "Paris",
    operator: "Les Estudines",
  },
  {
    id: "studelites-lyon-gerland",
    name: "Studélites Lyon Gerland",
    city: "Lyon",
    operator: "Studélites",
  },
  {
    id: "nemea-nantes-centre",
    name: "Nemea Appart’Étud Nantes Centre",
    city: "Nantes",
    operator: "Nemea",
  },
  {
    id: "student-factory-bordeaux",
    name: "Student Factory Bordeaux Bastide",
    city: "Bordeaux",
    operator: "Student Factory",
  },
];
