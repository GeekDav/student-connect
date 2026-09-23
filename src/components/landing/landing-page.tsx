import Image from "next/image";
import Link from "next/link";
import { AnchorLink } from "./anchor-link";
import { Reveal } from "./reveal";
import { ScrollToHash } from "./scroll-to-hash";

const features = [
  {
    title: "Annuaire de ta résidence",
    text: "Retrouve quelqu’un de ta filière, de ta nationalité ou qui partage tes centres d’intérêt — uniquement parmi tes voisins.",
  },
  {
    title: "Micro-événements",
    text: "Propose un tournoi FIFA, un verre ou une sortie. Les places se remplissent dans ta résidence, pas sur tout Internet.",
  },
  {
    title: "SOS & entraide",
    text: "Besoin urgent d’un coup de main ? Lance un SOS flash et vois qui est dispo dans le bâtiment.",
  },
  {
    title: "Tableau d’affichage",
    text: "Infos officielles de la résidence au même endroit : plus besoin de tout lire sur le panneau du hall.",
  },
];

const managerSteps = [
  {
    title: "On t’ouvre l’espace",
    text: "Pendant la phase pilote, Student-Connect active ta résidence avec toi — pas d’inscription publique payante.",
  },
  {
    title: "Tu animes le quotidien",
    text: "Invitations, annonces, validation des inscriptions, modération : tout au même endroit.",
  },
  {
    title: "Tu nous fais un retour",
    text: "Tes besoins concrets nous aident à améliorer l’outil avant une éventuelle offre payante, annoncée à l’avance.",
  },
];

export function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <ScrollToHash />
      <header className="animate-nav absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="font-display text-sm font-semibold tracking-wide text-white/90 transition-opacity hover:opacity-80"
          >
            Student-Connect
          </Link>
          <div className="flex items-center gap-4">
            <AnchorLink
              hash="partenaires"
              className="hidden text-sm font-medium text-white/85 transition-colors hover:text-white sm:inline"
            >
              Pour les résidences
            </AnchorLink>
            <Link
              href="/connexion"
              className="text-sm font-medium text-white/85 transition-colors hover:text-white"
            >
              Connexion
            </Link>
          </div>
        </div>
      </header>

      <section className="relative bg-[#0b161d]">
        <div className="relative aspect-[16/10] w-full overflow-hidden md:absolute md:inset-0 md:aspect-auto md:min-h-[100svh]">
          <Image
            src="/hero-residence.png"
            alt="Groupe d’étudiants de tous horizons réunis dans un espace commun de résidence"
            fill
            priority
            sizes="100vw"
            className="animate-hero-zoom object-cover object-[center_42%] md:object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#0b161d]/85 via-[#0b161d]/35 to-[#0b161d]/20 md:from-[#0b161d]/88 md:via-[#0b161d]/45 md:to-[#0b161d]/25"
            aria-hidden
          />
          <div
            className="absolute inset-0 hidden bg-gradient-to-r from-[#0b161d]/55 via-transparent to-transparent md:block"
            aria-hidden
          />
        </div>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col justify-end px-5 pb-14 pt-8 sm:px-8 sm:pb-16 md:min-h-[100svh] md:pb-20 md:pt-28">
          <p className="animate-hero-rise font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
            Student-Connect
          </p>
          <h1 className="animate-hero-rise-delay mt-5 max-w-xl font-display text-2xl font-medium leading-snug text-white sm:text-3xl md:text-[2.15rem]">
            Ta résidence, enfin connectée.
          </h1>
          <p className="animate-hero-rise-delay mt-4 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
            Retrouve tes voisins, propose une activité et suis la vie de ta
            résidence — simplement.
          </p>
          <div className="animate-hero-rise-delay-2 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/inscription"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-accent-hover hover:-translate-y-0.5"
            >
              Rejoindre ma résidence
            </Link>
            <AnchorLink
              hash="partenaires"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/35 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-[background-color,border-color] duration-200 hover:border-white/55 hover:bg-white/18"
            >
              Je gère une résidence
            </AnchorLink>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <Reveal className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-24">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Habiter ensemble, ce n’est pas encore se connaître.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Dans une résidence, on croise des dizaines de personnes sans savoir
            qui peut aider pour un devoir, qui organise quelque chose ce soir,
            ou ce que l’administration annonce vraiment.
          </p>
        </Reveal>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Tout ce dont tu as besoin, dans ta résidence.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
              Un espace fermé, réservé aux résidents validés. Pas de feed
              mondial — seulement ton immeuble.
            </p>
          </Reveal>

          <ul className="mt-12 divide-y divide-line border-y border-line">
            {features.map((feature, index) => (
              <Reveal key={feature.title}>
                <li className="grid gap-2 py-8 sm:grid-cols-[7rem_1fr] sm:gap-8">
                  <span className="font-display text-sm font-semibold text-accent">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-muted">
                      {feature.text}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="partenaires"
        className="relative scroll-mt-6 overflow-hidden border-y border-line bg-wash"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 10% 20%, rgba(12,107,92,0.12), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 80%, rgba(19,32,41,0.06), transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Phase pilote
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Pour les gestionnaires de résidence
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              Student-Connect est actuellement{" "}
              <strong className="font-semibold text-ink">gratuit</strong> pour
              un nombre limité de résidences partenaires. On cherche des retours
              d’usage concrets pour peaufiner l’outil — un abonnement pourra
              arriver plus tard, annoncé clairement à l’avance.
            </p>
          </Reveal>
          <ul className="mt-12 divide-y divide-line border-y border-line">
            {managerSteps.map((step, index) => (
              <Reveal key={step.title}>
                <li className="grid gap-2 py-8 sm:grid-cols-[7rem_1fr] sm:gap-8">
                  <span className="font-display text-sm font-semibold text-accent">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-muted">
                      {step.text}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal>
            <p className="mt-10 text-base leading-relaxed text-muted">
              Intéressé par le pilote ?{" "}
              <Link
                href="/nous-contacter"
                className="font-semibold text-accent transition-opacity hover:opacity-70"
              >
                Nous contacter
              </Link>
              {" · "}
              Déjà partenaire ?{" "}
              <Link
                href="/connexion?next=/gestionnaire"
                className="font-semibold text-accent transition-opacity hover:opacity-70"
              >
                Connexion
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <section id="offre" className="scroll-mt-6 bg-surface">
        <Reveal className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Offre pilote
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Pas de tarif public pour l’instant : on ouvre les espaces avec les
            résidences sélectionnées.
          </p>

          <div className="mt-10 rounded-3xl border border-line bg-background px-6 py-8 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Gratuit — phase pilote
            </p>
            <p className="mt-4 font-display text-5xl font-semibold tracking-tight text-ink">
              0 €
            </p>
            <p className="mt-2 text-base text-muted">
              pour les résidences partenaires pendant le lancement
            </p>
            <ul className="mt-6 space-y-2 text-sm leading-relaxed text-muted">
              <li>Espace étudiants + espace gestionnaire</li>
              <li>Invitations, annonces, modération</li>
              <li>Retours d’usage bienvenus pour améliorer le produit</li>
            </ul>
            <p className="mt-8 text-sm leading-relaxed text-muted">
              Pour candidater au pilote, utilise{" "}
              <Link
                href="/nous-contacter"
                className="font-semibold text-accent"
              >
                Nous contacter
              </Link>
              . Les comptes gestionnaire sont ouverts par nos soins.
            </p>
            <Link
              href="/nous-contacter"
              className="mt-6 inline-flex h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
            >
              Candidater au pilote
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="border-t border-line bg-background">
        <Reveal className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-24">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Prêt à rejoindre ta résidence ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Étudiant : crée ton compte avec une invitation ou une demande à
            valider. Gestionnaire partenaire : connecte-toi à ton espace.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/inscription"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-accent-hover hover:-translate-y-0.5"
            >
              Créer mon compte étudiant
            </Link>
            <Link
              href="/connexion?next=/gestionnaire"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-line bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-wash"
            >
              Espace gestionnaire
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link
            href="/"
            className="font-display text-sm font-semibold text-ink transition-opacity hover:opacity-70"
          >
            Student-Connect
          </Link>
          <div className="flex flex-wrap gap-5 text-sm text-muted">
            <Link href="/nous-contacter" className="hover:text-ink">
              Nous contacter
            </Link>
            <AnchorLink hash="partenaires" className="hover:text-ink">
              Phase pilote
            </AnchorLink>
            <AnchorLink hash="offre" className="hover:text-ink">
              Offre
            </AnchorLink>
            <Link href="/mentions-legales" className="hover:text-ink">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="hover:text-ink">
              Confidentialité
            </Link>
            <Link href="/connexion" className="hover:text-ink">
              Connexion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
