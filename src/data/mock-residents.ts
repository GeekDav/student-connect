export type Resident = {
  id: string;
  firstName: string;
  lastName: string;
  school: string;
  fieldOfStudy: string;
  interests: string[];
  /** Présent uniquement si opt-in (sinon undefined). */
  nationality?: string;
  bio?: string;
};

export const MOCK_RESIDENTS: Resident[] = [
  {
    id: "r1",
    firstName: "Léa",
    lastName: "Martin",
    school: "Université de Lille",
    fieldOfStudy: "Droit",
    interests: ["Cuisine", "Cinéma"],
    nationality: "France",
    bio: "M1 droit des affaires. OK pour réviser en binôme.",
  },
  {
    id: "r2",
    firstName: "Karim",
    lastName: "Benali",
    school: "IMT Nord Europe",
    fieldOfStudy: "Informatique",
    interests: ["FIFA", "Running"],
    nationality: "Algérie",
    bio: "Dev web & jeux vidéo le week-end.",
  },
  {
    id: "r3",
    firstName: "Sophie",
    lastName: "Tremblay",
    school: "Sciences Po Lille",
    fieldOfStudy: "Sciences politiques",
    interests: ["Débat", "Photo"],
    nationality: "Canada",
  },
  {
    id: "r4",
    firstName: "Nina",
    lastName: "Rodriguez",
    school: "Université de Lille",
    fieldOfStudy: "Médecine",
    interests: ["Course à pied", "Yoga"],
    bio: "P2 médecine. Dispo pour entraide anatomie.",
  },
  {
    id: "r5",
    firstName: "Amadou",
    lastName: "Diallo",
    school: "École Centrale Lille",
    fieldOfStudy: "Ingénierie",
    interests: ["Football", "Cuisine"],
    nationality: "Sénégal",
    bio: "Toujours partant pour un match ou un plat partagé.",
  },
  {
    id: "r6",
    firstName: "Emma",
    lastName: "Keller",
    school: "Université de Lille",
    fieldOfStudy: "Informatique",
    interests: ["Dev Web", "Musique"],
    nationality: "Allemagne",
    bio: "Besoin d’aide en algo ? Envoie-moi un message.",
  },
  {
    id: "r7",
    firstName: "Hugo",
    lastName: "Petit",
    school: "IUT A Lille",
    fieldOfStudy: "Gestion",
    interests: ["Basket", "Séries"],
  },
  {
    id: "r8",
    firstName: "Fatou",
    lastName: "Sow",
    school: "Université de Lille",
    fieldOfStudy: "Droit",
    interests: ["Lecture", "Théâtre"],
    nationality: "Sénégal",
  },
  {
    id: "r9",
    firstName: "Thomas",
    lastName: "Nguyen",
    school: "Polytech Lille",
    fieldOfStudy: "Ingénierie",
    interests: ["FIFA", "Manga"],
    nationality: "France",
  },
  {
    id: "r10",
    firstName: "Clara",
    lastName: "Moreau",
    school: "Université de Lille",
    fieldOfStudy: "Psychologie",
    interests: ["Yoga", "Cuisine", "Photo"],
    bio: "L3 psycho. Ouverte aux sorties détente.",
  },
];

export function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "fr"));
}
