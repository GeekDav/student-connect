import type { Metadata } from "next";
import { LegalSection, LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Mentions légales — Student-Connect",
  description: "Mentions légales du service Student-Connect.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalShell title="Mentions légales">
      <p className="text-sm text-muted">
        Version minimale — à compléter avec les informations définitives de
        l’éditeur avant mise en production.
      </p>

      <LegalSection title="Éditeur">
        <p>
          Le site <strong className="font-medium text-ink">Student-Connect</strong>{" "}
          est édité par :
        </p>
        <p>
          [Nom / raison sociale à compléter]
          <br />
          [Adresse postale à compléter]
          <br />
          [Forme juridique, capital, RCS / SIREN à compléter]
          <br />
          E-mail de contact :{" "}
          <span className="text-ink">contact@student-connect.fr</span>{" "}
          (placeholder)
        </p>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>[Nom du directeur de la publication à compléter]</p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          Le site est destiné à être hébergé par un prestataire européen (ex.
          Vercel / prestataire d’infrastructure + base de données managée). Les
          mentions d’hébergeur exactes (raison sociale, adresse) seront
          renseignées avant le lancement public.
        </p>
      </LegalSection>

      <LegalSection title="Objet du service">
        <p>
          Student-Connect est une plateforme numérique destinée à connecter les
          étudiants d’une même résidence étudiante (annuaire local, activités,
          entraide, annonces officielles), dans le cadre d’espaces cloisonnés par
          résidence partenaire.
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L’ensemble des contenus (textes, graphismes, logo, structure) présents
          sur Student-Connect est protégé. Toute reproduction non autorisée est
          interdite, sauf usage prévu par la loi.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Pour toute question relative au service :{" "}
          <span className="text-ink">contact@student-connect.fr</span>{" "}
          (placeholder à remplacer).
        </p>
      </LegalSection>
    </LegalShell>
  );
}
