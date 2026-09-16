export type PlatformResidence = {
  id: string;
  name: string;
  city: string;
  address: string;
  operator: string;
  managerName: string;
  managerEmail: string;
  createdAt: string;
  status: "active" | "paused";
  pendingStudents: number;
  activeStudents: number;
};

export const INITIAL_PLATFORM_RESIDENCES: PlatformResidence[] = [
  {
    id: "res-1",
    name: "Nexity Studéa Lille Euralille",
    city: "Lille",
    address: "12 rue de Tournai, 59000 Lille",
    operator: "Nexity Studéa",
    managerName: "Marie Lefèvre",
    managerEmail: "marie.lefevre@studea-lille.fr",
    createdAt: "12 sept. 2026",
    status: "active",
    pendingStudents: 3,
    activeStudents: 48,
  },
  {
    id: "res-2",
    name: "Les Estudines Paris Bercy",
    city: "Paris",
    address: "8 rue de Bercy, 75012 Paris",
    operator: "Les Estudines",
    managerName: "Paul Mercier",
    managerEmail: "p.mercier@estudines-bercy.fr",
    createdAt: "5 sept. 2026",
    status: "active",
    pendingStudents: 1,
    activeStudents: 62,
  },
];
