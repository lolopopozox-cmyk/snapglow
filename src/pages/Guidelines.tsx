import { Seo } from '../components/Seo';
import type { ReactNode } from 'react';

function H2({ children }: { children: ReactNode }) {
  return <h2 className="font-display mt-10 text-2xl font-extrabold tracking-tight text-ink">{children}</h2>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 leading-relaxed text-ink-soft">{children}</p>;
}

export default function Guidelines() {
  return (
    <>
      <Seo
        title="Community Guidelines · Snap Glow"
        description="Be kind, be original, keep Snap Glow fun."
        path="/guidelines"
        noindex={false}
      />
      <article className="mx-auto max-w-3xl">
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-ink-mute">
          Community
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Community Guidelines</h1>
        <p className="mt-2 text-sm font-semibold text-ink-mute">Last updated: October 2026</p>

        <P>
          Snap Glow is a place to show your vibe and get noticed — not to tear anyone down.
          These guidelines keep the community fun for everyone. They're friendly, but we take
          them seriously.
        </P>

        <H2>Be kind</H2>
        <P>
          Treat other creators the way you'd want to be treated. No harassment, bullying,
          hate speech, or personal attacks — in cards, posts, comments, or battle titles. If
          you wouldn't say it to someone's face, don't post it here.
        </P>

        <H2>Original content only</H2>
        <P>
          Share work that's yours: your own photos, your own captions, your own vibe. Don't
          upload other people's art or photos, and don't copy another creator's card and
          present it as your own. Give credit where it's due.
        </P>

        <H2>No spam, no hate, no impersonation</H2>
        <P>
          Don't flood the feed with repetitive posts, don't post hateful or discriminatory
          content, and don't pretend to be someone you're not. Usernames that imitate real
          people or other creators to mislead the community aren't allowed.
        </P>

        <H2>Streak honesty</H2>
        <P>
          Streak counts are entered by the card owner and are not verified by Snapchat — so
          keep them honest. Inflating your streak to look cooler might seem harmless, but it
          breaks trust in the community. Your vibe should speak for itself.
        </P>

        <H2>How reporting works</H2>
        <P>
          See something that breaks these guidelines? Use the report button on any card, post,
          battle, or profile. Reports are stored for review by the moderation queue. In a production version, reports go into a human
          moderation queue where real reviewers decide what happens next.
        </P>

        <H2>Consequences</H2>
        <P>
          Enforcement actions apply to accounts and content — repeated violations lead to removal.
          browser data. In a future production version, breaking these guidelines could lead
          to content removal, temporary restrictions, or account suspension, depending on the
          severity and how often it happens.
        </P>

        <P>
          Not sure if something crosses the line? Email <strong>snapglowofficial@gmail.com</strong>{' '}
          and ask. We'd rather answer a question than clean up a mess.
        </P>
      </article>
    </>
  );
}
