import Image from "next/image";
import Link from "next/link";
import { Reveal } from "./reveal";
import type { PublicPricing } from "@/lib/stripe";

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
    title: "Crée l’espace de ta résidence",
    text: "Nom, adresse, ton compte gestionnaire — en quelques minutes.",
  },
  {
    title: "Essaie 14 jours",
    text: "Invite des résidents, publie, modère. Carte enregistrée, tu peux annuler avant la fin de l’essai.",
  },
  {
    title: "Anime au quotidien",
    text: "Annonces, invitations, validation des inscriptions : tout centralisé.",
  },
];

export function LandingPage({ pricing }: { pricing: PublicPricing }) {
  return (
    <div className="bg-background text-foreground">
      <header className="animate-nav absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="font-display text-sm font-semibold tracking-wide text-white/90 transition-opacity hover:opacity-80"
          >
            Student-Connect
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/creer-residence"
              className="hidden text-sm font-medium text-white/85 transition-colors hover:text-white sm:inline"
            >
              Pour les résidences
            </Link>
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
            <Link
              href="/creer-residence"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/35 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-[background-color,border-color] duration-200 hover:border-white/55 hover:bg-white/18"
            >
              Équiper ma résidence
            </Link>
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

      <section className="relative overflow-hidden border-y border-line bg-wash">
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
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Pour les gestionnaires de résidence
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              Un espace pour publier les infos officielles, valider les
              inscriptions et faire vivre le bâtiment — sans app dispersée ni
              groupe WhatsApp interminable.
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
        </div>
      </section>

      <section id="tarif" className="bg-surface">
        <Reveal className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Un tarif simple
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Une résidence, un abonnement. Le prix affiché vient de Stripe : tu
            le changes dans le Dashboard, la page suit.
          </p>

          <div className="mt-10 rounded-3xl border border-line bg-background px-6 py-8 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Essai {pricing.trialDays} jours
            </p>
            <p className="mt-4 font-display text-5xl font-semibold tracking-tight text-ink">
              {pricing.configured ? pricing.amountLabel : "—"}
            </p>
            <p className="mt-2 text-base text-muted">{pricing.intervalLabel}</p>
            <ul className="mt-6 space-y-2 text-sm leading-relaxed text-muted">
              <li>Espace étudiants + espace gestionnaire</li>
              <li>Invitations, annonces, modération</li>
              <li>Annule avant la fin de l’essai : 0 €</li>
            </ul>
            <Link
              href="/creer-residence"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-accent-hover hover:-translate-y-0.5"
            >
              Démarrer l’essai gratuit
            </Link>
            {!pricing.configured ? (
              <p className="mt-4 text-xs text-muted">
                Tarif bientôt affiché — Stripe en cours de configuration.
              </p>
            ) : null}
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
            valider. Gestionnaire : ouvre l’espace de ton bâtiment.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/inscription"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-accent-hover hover:-translate-y-0.5"
            >
              Créer mon compte étudiant
            </Link>
            <Link
              href="/creer-residence"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-line bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-wash"
            >
              Équiper ma résidence
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
            <Link href="/#tarif" className="hover:text-ink">
              Tarif
            </Link>
            <Link href="/creer-residence" className="hover:text-ink">
              Pour les résidences
            </Link>
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
