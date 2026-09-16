export type PendingRegistration = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roomNumber: string;
  fieldOfStudy: string;
  school: string;
  requestedAt: string;
  status: "pending" | "accepted" | "refused";
};

export type OfficialAnnouncement = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  published: boolean;
};

export type ModerationReport = {
  id: string;
  targetType: "event" | "sos" | "recyclerie" | "message";
  targetLabel: string;
  reason: string;
  reporter: string;
  reportedAt: string;
  status: "open" | "removed" | "dismissed";
};

/** Membre de la résidence côté gestionnaire (cycle de vie). */
export type ResidenceMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roomNumber: string;
  fieldOfStudy: string;
  status: "active" | "left";
  joinedAt: string;
  leftAt?: string;
  leaveReason?: string;
};

export const MANAGER_RESIDENCE = {
  name: "Nexity Studéa Lille Euralille",
  city: "Lille",
};

export const INITIAL_PENDING: PendingRegistration[] = [
  {
    id: "p1",
    firstName: "Inès",
    lastName: "Durand",
    email: "ines.durand@email.fr",
    roomNumber: "118",
    fieldOfStudy: "Médecine",
    school: "Université de Lille",
    requestedAt: "Aujourd’hui · 09:12",
    status: "pending",
  },
  {
    id: "p2",
    firstName: "Yanis",
    lastName: "Benbrahim",
    email: "yanis.b@email.fr",
    roomNumber: "305",
    fieldOfStudy: "Informatique",
    school: "IMT Nord Europe",
    requestedAt: "Hier · 18:40",
    status: "pending",
  },
  {
    id: "p3",
    firstName: "Chloé",
    lastName: "Bernard",
    email: "chloe.bernard@email.fr",
    roomNumber: "212",
    fieldOfStudy: "Droit",
    school: "Université de Lille",
    requestedAt: "Hier · 11:05",
    status: "pending",
  },
];

export const INITIAL_ANNOUNCEMENTS: OfficialAnnouncement[] = [
  {
    id: "a1",
    title: "Coupure d’eau chaude — jeudi soir",
    body: "Intervention prévue de 20h à 23h sur l’aile B. Merci de vous organiser en avance.",
    publishedAt: "Aujourd’hui · 08:00",
    published: true,
  },
  {
    id: "a2",
    title: "Soirée d’accueil nouveaux résidents",
    body: "Vendredi 19h en salle commune. Boissons offertes par la résidence.",
    publishedAt: "Hier · 16:20",
    published: true,
  },
];

export const INITIAL_REPORTS: ModerationReport[] = [
  {
    id: "r1",
    targetType: "event",
    targetLabel: "Soirée bruit excessif — chambre 410",
    reason: "Contenu inapproprié / gêne pour les voisins",
    reporter: "Léa M.",
    reportedAt: "Il y a 3 h",
    status: "open",
  },
  {
    id: "r2",
    targetType: "recyclerie",
    targetLabel: "Vente téléphone volé ?",
    reason: "Annonce suspecte",
    reporter: "Karim B.",
    reportedAt: "Hier",
    status: "open",
  },
];

export const INITIAL_MEMBERS: ResidenceMember[] = [
  {
    id: "mem-1",
    firstName: "Léa",
    lastName: "Martin",
    email: "lea.martin@email.fr",
    roomNumber: "302",
    fieldOfStudy: "Droit",
    status: "active",
    joinedAt: "2 sept. 2026",
  },
  {
    id: "mem-2",
    firstName: "Karim",
    lastName: "Benali",
    email: "karim.benali@email.fr",
    roomNumber: "118",
    fieldOfStudy: "Informatique",
    status: "active",
    joinedAt: "28 août 2026",
  },
  {
    id: "mem-3",
    firstName: "Nina",
    lastName: "Rodriguez",
    email: "nina.r@email.fr",
    roomNumber: "214",
    fieldOfStudy: "Médecine",
    status: "active",
    joinedAt: "1 sept. 2026",
  },
  {
    id: "mem-4",
    firstName: "Hugo",
    lastName: "Petit",
    email: "hugo.petit@email.fr",
    roomNumber: "407",
    fieldOfStudy: "Gestion",
    status: "active",
    joinedAt: "15 août 2026",
  },
  {
    id: "mem-5",
    firstName: "Camille",
    lastName: "Roux",
    email: "camille.roux@email.fr",
    roomNumber: "101",
    fieldOfStudy: "Psycho",
    status: "left",
    joinedAt: "10 juin 2026",
    leftAt: "31 août 2026",
    leaveReason: "Fin de bail",
  },
];
