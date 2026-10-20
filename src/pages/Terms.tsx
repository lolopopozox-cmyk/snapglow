import { Seo } from '../components/Seo';
import type { ReactNode } from 'react';

function H2({ children }: { children: ReactNode }) {
  return <h2 className="font-display mt-10 text-2xl font-extrabold tracking-tight text-ink">{children}</h2>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 leading-relaxed text-ink-soft">{children}</p>;
}

export default function Terms() {
  return (
    <>
      <Seo
        title="Terms of Service · Snap Glow"
        description="The rules for using Snap Glow — the web home for Snapchat users."
        path="/terms"
        noindex={false}
      />
      <article className="mx-auto max-w-3xl">
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-ink-mute">
          Legal
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Terms of Service</h1>
        <p className="mt-2 text-sm font-semibold text-ink-mute">Last updated: October 2026</p>

        <P>
          Welcome to Snap Glow! These terms cover your use of Snap Glow — the web home for
          Snapchat users. By using the site, you agree to them. They&apos;re written in plain
          language on purpose.
        </P>

        <H2>Eligibility</H2>
        <P>
          You must be <strong>13 or older</strong> to use Snap Glow. If you&apos;re under 13, please
          come back when you&apos;re old enough.
        </P>

        <H2>Accounts</H2>
        <P>
          You need a free Snap Glow account to create cards, post, vote and battle. You are
          responsible for keeping your password safe. Accounts currently live in your browser
          only — if you clear site data, your account is gone and cannot be recovered yet.
        </P>

        <H2>Acceptable use</H2>
        <P>
          Use Snap Glow for what it&apos;s for: creating flex and streak cards, sharing with the
          community, and voting in battles. Don&apos;t try to break the site, impersonate others,
          or post content that is hateful, harassing, illegal, or spammy. Our{' '}
          <a href="/guidelines" className="font-bold text-brand-violet underline">Community Guidelines</a>{' '}
          spell this out in more detail.
        </P>

        <H2>Your content</H2>
        <P>
          You own everything you create here. By using Snap Glow, you grant us a limited license
          to display your cards, posts and battles on the site so it can function. Nothing is
          uploaded to our servers today — your content stays in your browser.
        </P>

        <H2>Glow Points and rewards</H2>
        <P>
          Glow Points, levels, badges and leaderboard positions are on-platform recognition
          only. They have <strong>no monetary value</strong>, cannot be exchanged for money or
          prizes, and we never promise payouts of any kind.
        </P>

        <H2>No Snapchat affiliation</H2>
        <P>
          Snap Glow is a fan-made utility for Snapchat users. It is <strong>not affiliated with,
          endorsed by, or sponsored by Snapchat</strong> or Snap Inc. in any way. We will never
          ask for your Snapchat password.
        </P>

        <H2>Streaks are unverified</H2>
        <P>
          Streak counts are entered by the card owner and are not verified by Snapchat. Treat
          them as fun, self-reported numbers — nothing more.
        </P>

        <H2>Availability</H2>
        <P>
          We make <strong>no guarantees of uptime, availability, or data persistence</strong>.
          Your data lives in your browser and can be lost if you clear storage or switch
          devices. Don&apos;t use Snap Glow for anything important.
        </P>

        <H2>Changes</H2>
        <P>
          We may update these terms as Snap Glow evolves. If we do, we&apos;ll update the
          &quot;Last updated&quot; date above. Continued use means you accept the new terms.
        </P>

        <H2>Contact</H2>
        <P>
          Questions about these terms? Email <strong>snapglowofficial@gmail.com</strong>.
        </P>
      </article>
    </>
  );
}
