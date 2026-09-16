import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Confidentialité — Student-Connect",
  description:
    "Politique de confidentialité et protection des données personnelles — Student-Connect.",
};

export default function ConfidentialitePage() {
  return (
    <LegalShell title="Confidentialité">
      <p className="text-sm text-muted">
        Politique minimale RGPD — à finaliser avec un conseil juridique avant
        production. Dernière mise à jour indicative : septembre 2026.
      </p>

      <LegalSection title="Responsable du traitement">
        <p>
          Le responsable du traitement des données est l’éditeur de
          Student-Connect ([raison sociale à compléter]). Pour toute demande
          relative à vos données :{" "}
          <span className="text-ink">privacy@student-connect.fr</span>{" "}
          (placeholder).
        </p>
      </LegalSection>

      <LegalSection title="Données collectées">
        <p>Selon votre usage du service, nous pouvons traiter :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Identité : prénom, nom, e-mail, mot de passe (hashé)</li>
          <li>
            Profil résidence : école, domaine d’études, centres d’intérêt, bio
          </li>
          <li>
            Nationalité / origine : uniquement si vous choisissez de la
            renseigner (opt-in)
          </li>
          <li>
            Numéro de chambre : visible par le gestionnaire de votre résidence
            pour validation, pas par les autres résidents
          </li>
          <li>
            Contenus que vous publiez : événements, SOS, annonces recyclerie,
            messages
          </li>
          <li>Données techniques de connexion (logs, sécurité)</li>
        </ul>
      </LegalSection>

      <LegalSection title="Finalités">
        <ul className="list-disc space-y-1 pl-5">
          <li>Créer et gérer votre compte</li>
          <li>Vous rattacher à votre résidence partenaire</li>
          <li>Permettre l’annuaire, l’entraide et la vie de résidence</li>
          <li>Permettre au gestionnaire de valider et modérer</li>
          <li>Assurer la sécurité et le bon fonctionnement du service</li>
        </ul>
      </LegalSection>

      <LegalSection title="Base légale">
        <p>
          Exécution du contrat (fourniture du service), intérêt légitime
          (sécurité, prévention des abus) et, le cas échéant, votre consentement
          (ex. affichage de la nationalité).
        </p>
      </LegalSection>

      <LegalSection title="Destinataires">
        <p>
          Vos données de profil et contenus sont visibles, selon les règles du
          produit, par les membres validés de <strong className="font-medium text-ink">votre
          résidence uniquement</strong>. Le gestionnaire de la résidence accède aux
          informations nécessaires à la validation et à la modération (dont le
          n° de chambre). Des sous-traitants techniques (hébergement, e-mail)
          peuvent traiter des données pour notre compte, dans le cadre
          d’accords conformes.
        </p>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <p>
          Les données sont conservées pendant la durée d’utilisation du service,
          puis archivées ou supprimées selon les besoins légaux et de sécurité.
          En cas de départ d’une résidence, l’accès à cet espace est retiré ; le
          compte peut être conservé pour une éventuelle autre résidence, sauf
          demande de suppression.
        </p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Conformément au RGPD, vous disposez d’un droit d’accès, de
          rectification, d’effacement, de limitation, d’opposition et de
          portabilité, dans les conditions prévues par la loi. Vous pouvez
          également introduire une réclamation auprès de la CNIL (
          <a
            href="https://www.cnil.fr"
            className="font-medium text-ink underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            cnil.fr
          </a>
          ).
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          Nous mettons en œuvre des mesures raisonnables pour protéger vos
          données (contrôle d’accès par résidence, validation gestionnaire,
          bonnes pratiques techniques). Aucun système n’est infaillible.
        </p>
      </LegalSection>

      <LegalSection title="Mentions légales">
        <p>
          Voir aussi les{" "}
          <Link
            href="/mentions-legales"
            className="font-medium text-ink underline-offset-2 hover:underline"
          >
            mentions légales
          </Link>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
