export type StudentProfile = {
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  fieldOfStudy: string;
  interests: string;
  roomNumber: string;
  showNationality: boolean;
  nationality: string;
  bio: string;
};

export const INITIAL_PROFILE: StudentProfile = {
  firstName: "David",
  lastName: "Martin",
  email: "david.martin@email.fr",
  school: "Université de Lille",
  fieldOfStudy: "Informatique",
  interests: "FIFA, Dev Web, Running",
  roomNumber: "214",
  showNationality: false,
  nationality: "",
  bio: "Étudiant en info, toujours partant pour un coup de main ou un match.",
};
