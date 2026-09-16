export type SosRequest = {
  id: string;
  title: string;
  description: string;
  author: string;
  timeLabel: string;
  status: "open" | "helped" | "closed";
  helpers: number;
  iHelped: boolean;
};

export const INITIAL_SOS: SosRequest[] = [
  {
    id: "s1",
    title: "Quelqu’un a un tire-bouchon ?",
    description: "Besoin urgent pour ce soir, je le rends dans la foulée.",
    author: "Karim B.",
    timeLabel: "Il y a 20 min",
    status: "open",
    helpers: 0,
    iHelped: false,
  },
  {
    id: "s2",
    title: "Machine à laver — mode d’emploi ?",
    description:
      "Première lessive ici, je ne trouve pas le bon programme. Qui peut m’expliquer en 2 minutes ?",
    author: "Emma K.",
    timeLabel: "Il y a 1 h",
    status: "open",
    helpers: 1,
    iHelped: false,
  },
  {
    id: "s3",
    title: "Besoin de sel / épices",
    description: "Je cuisine et il me manque du sel. Échange café possible.",
    author: "Clara M.",
    timeLabel: "Il y a 3 h",
    status: "helped",
    helpers: 2,
    iHelped: false,
  },
  {
    id: "s4",
    title: "Câble HDMI pour un devoir ?",
    description: "Besoin de brancher mon ordi sur la TV de la salle commune.",
    author: "Hugo P.",
    timeLabel: "Hier",
    status: "closed",
    helpers: 1,
    iHelped: false,
  },
];
