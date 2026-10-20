import { Seo } from '../components/Seo';
import type { ReactNode } from 'react';

function H2({ children }: { children: ReactNode }) {
  return <h2 className="font-display mt-10 text-2xl font-extrabold tracking-tight text-ink">{children}</h2>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 leading-relaxed text-ink-soft">{children}</p>;
}

export default function Privacy() {
  return (
    <>
      <Seo
        title="Privacy Policy · Snap Glow"
        description="How Snap Glow handles your data — accounts, cards, posts and votes."
        path="/privacy"
        noindex={false}
      />
      <article className="mx-auto max-w-3xl">
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-ink-mute">
          Legal
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Privacy Policy</h1>
        <p className="mt-2 text-sm font-semibold text-ink-mute">Last updated: October 2026</p>

        <P>
          Snap Glow is currently a browser-local experience. That means almost everything
          happens inside your own browser — there are no servers collecting your data today.
        </P>

        <H2>What we store — and where</H2>
        <P>
          Your account, flex cards, posts, battles, votes and preferences are saved in your
          browser's local storage (<code className="rounded bg-lav px-1.5 py-0.5 text-sm font-bold text-ink">localStorage</code>).
          This data lives on <strong>this device only</strong>: it is never uploaded, synced, or
          shared with anyone. Content you publish appears in the feed on this device only — it
          won&apos;t appear on other devices until a future update adds server accounts.
        </P>

        <H2>Accounts and passwords</H2>
        <P>
          When you create an account, your password is converted into a one-way SHA-256 hash
          before it is stored — we never keep your plaintext password. Your username must be
          unique on this device. Because accounts live in your browser, clearing site data
          removes them, and there is currently no password-recovery process.
        </P>
        <P>
          <strong>Important:</strong> your Snap Glow account is separate from Snapchat. We will
          never ask for your Snapchat password, cookies, or private tokens — not here, not by
          email, not anywhere. Anyone asking for those is not us.
        </P>

        <H2>Contacting us</H2>
        <P>
          If you email us at <strong>snapglowofficial@gmail.com</strong>, your message goes
          straight to our inbox through your own email app — it is not stored on Snap Glow
          servers, because there are no Snap Glow servers yet.
        </P>

        <H2>Advertising</H2>
        <P>
          Snap Glow plans to show display ads (via Adsterra) to keep the service free. Ad slots
          are placeholders until the owner connects a publisher account. We do not sell your
          personal data — and since your data never leaves your device today, there is nothing
          to sell.
        </P>

        <H2>Your rights &amp; deletion</H2>
        <P>
          Because your data never leaves your device, you can delete everything at any time by
          choosing <strong>&quot;Reset local data&quot;</strong> in the site footer or by clearing your
          browser storage. No request needed, no waiting period.
        </P>

        <H2>Honesty about who we are</H2>
        <P>
          Snap Glow is a fan-made utility for Snapchat users. We are not affiliated with,
          endorsed by, or sponsored by Snap Inc. We do not invent a company registration,
          business address, certifications, or compliance claims we don&apos;t have.
        </P>

        <H2>Changes to this policy</H2>
        <P>
          If Snap Glow adds server accounts or analytics in the future, we will update this page
          and highlight what changed before collecting anything new.
        </P>

        <P>
          Questions? Email us at <strong>snapglowofficial@gmail.com</strong>.
        </P>
      </article>
    </>
  );
}
