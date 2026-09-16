import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/app/profile-editor";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Profil — Student-Connect",
  description: "Modifie ton profil résident sur Student-Connect.",
};

export default async function ProfilPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        include: { residence: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user) redirect("/connexion");

  const residenceName =
    user.memberships[0]?.residence.name ?? "Résidence non assignée";

  return (
    <ProfileEditor
      residenceName={residenceName}
      initialProfile={{
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        school: user.school ?? "",
        fieldOfStudy: user.fieldOfStudy ?? "",
        interests: user.interests ?? "",
        roomNumber: user.roomNumber ?? "",
        showNationality: user.showNationality,
        nationality: user.nationality ?? "",
        bio: user.bio ?? "",
      }}
      initialAvatarUrl={user.avatarUrl}
    />
  );
}
