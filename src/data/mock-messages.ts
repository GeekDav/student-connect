export type ChatMessage = {
  id: string;
  fromMe: boolean;
  text: string;
  timeLabel: string;
};

export type Conversation = {
  id: string;
  peerName: string;
  peerField: string;
  preview: string;
  updatedLabel: string;
  unread: number;
  messages: ChatMessage[];
};

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    peerName: "Karim Benali",
    peerField: "Informatique",
    preview: "Je peux te prêter le tire-bouchon vers 19h.",
    updatedLabel: "Il y a 12 min",
    unread: 2,
    messages: [
      {
        id: "m1",
        fromMe: true,
        text: "Salut Karim, tu as vu mon SOS pour le tire-bouchon ?",
        timeLabel: "18:02",
      },
      {
        id: "m2",
        fromMe: false,
        text: "Oui ! Je peux te le prêter vers 19h.",
        timeLabel: "18:10",
      },
      {
        id: "m3",
        fromMe: false,
        text: "Je peux te prêter le tire-bouchon vers 19h.",
        timeLabel: "18:11",
      },
    ],
  },
  {
    id: "c2",
    peerName: "Léa Martin",
    peerField: "Droit",
    preview: "Parfait, à tout à l’heure pour le FIFA.",
    updatedLabel: "Il y a 1 h",
    unread: 0,
    messages: [
      {
        id: "m1",
        fromMe: false,
        text: "Tu viens toujours au tournoi ce soir ?",
        timeLabel: "16:40",
      },
      {
        id: "m2",
        fromMe: true,
        text: "Oui, j’arrive vers 20h.",
        timeLabel: "16:45",
      },
      {
        id: "m3",
        fromMe: false,
        text: "Parfait, à tout à l’heure pour le FIFA.",
        timeLabel: "17:02",
      },
    ],
  },
  {
    id: "c3",
    peerName: "Sophie Tremblay",
    peerField: "Sciences politiques",
    preview: "Le micro-ondes est toujours dispo si tu veux.",
    updatedLabel: "Hier",
    unread: 0,
    messages: [
      {
        id: "m1",
        fromMe: true,
        text: "Salut, ton annonce micro-ondes m’intéresse.",
        timeLabel: "Hier 21:10",
      },
      {
        id: "m2",
        fromMe: false,
        text: "Le micro-ondes est toujours dispo si tu veux.",
        timeLabel: "Hier 21:30",
      },
    ],
  },
];
