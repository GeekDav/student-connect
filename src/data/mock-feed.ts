export type FeedItem =
  | {
      id: string;
      kind: "annonce";
      title: string;
      body: string;
      time: string;
      author: string;
    }
  | {
      id: string;
      kind: "event";
      title: string;
      body: string;
      time: string;
      author: string;
      meta: string;
    }
  | {
      id: string;
      kind: "sos";
      title: string;
      body: string;
      time: string;
      author: string;
    }
  | {
      id: string;
      kind: "recyclerie";
      title: string;
      body: string;
      time: string;
      author: string;
      meta: string;
    };

export const MOCK_RESIDENCE = {
  name: "Nexity Studéa Lille Euralille",
  city: "Lille",
};

export const MOCK_USER = {
  firstName: "David",
  fieldOfStudy: "Informatique",
};

export const MOCK_FEED: FeedItem[] = [
  {
    id: "1",
    kind: "annonce",
    title: "Coupure d’eau chaude — jeudi soir",
    body: "Intervention prévue de 20h à 23h sur l’aile B. Merci de vous organiser en avance.",
    time: "Il y a 2 h",
    author: "Administration",
  },
  {
    id: "2",
    kind: "event",
    title: "Tournoi FIFA chambre 302",
    body: "Petit tournoi ce soir, manettes fournies. Ambiance cool, niveau tous acceptés.",
    time: "Il y a 3 h",
    author: "Léa M.",
    meta: "Aujourd’hui · 20h · 3 places",
  },
  {
    id: "3",
    kind: "sos",
    title: "Quelqu’un a un tire-bouchon ?",
    body: "Besoin urgent pour ce soir, je le rends dans la foulée.",
    time: "Il y a 5 h",
    author: "Karim B.",
  },
  {
    id: "4",
    kind: "recyclerie",
    title: "Micro-ondes à donner",
    body: "Fonctionne parfaitement, je quitte la résidence fin du mois.",
    time: "Hier",
    author: "Sophie T.",
    meta: "Don · Hall A",
  },
  {
    id: "5",
    kind: "event",
    title: "Verre en terrasse ?",
    body: "Qui est partant pour un verre vers 19h près de la résidence ?",
    time: "Hier",
    author: "Nina R.",
    meta: "Ce soir · 19h · ouvert",
  },
];

export const KIND_LABEL: Record<FeedItem["kind"], string> = {
  annonce: "Annonce officielle",
  event: "Micro-événement",
  sos: "SOS",
  recyclerie: "Recyclerie",
};
