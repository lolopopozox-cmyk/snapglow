import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { PageHeader, Field, TextArea, SelectEl } from '../components/ui';
import { useToast } from '../components/Toast';
import { Mail, Clock, ShieldCheck, FileText, Sparkles } from 'lucide-react';

const EMAIL = 'snapglowofficial@gmail.com';
const SUBJECTS = ['General question', 'Report a problem', 'Battle feedback', 'Partnership'];

export default function Contact() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const subject = String(form.get('subject') ?? SUBJECTS[0]);
    const message = String(form.get('message') ?? '').trim();

    if (!name) {
      toast('Please add your name so we know what to call you.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast('Please enter a valid email address.');
      return;
    }
    if (!message) {
      toast('Please write your message before sending.');
      return;
    }

    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast('Opening your email app — the message is sent by you, not stored on our servers.');
  };

  return (
    <>
      <Seo
        title="Contact Us · Snap Glow"
        description="Questions about Snap Glow? Email snapglowofficial@gmail.com."
        path="/contact"
        noindex={false}
      />
      <PageHeader
        eyebrow="We're here"
        title="Contact Us"
        sub="Questions, feedback or something to report — we'd love to hear from you."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info card */}
        <div className="card-surface flex flex-col rounded-card p-8">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-lav text-brand-violet">
            <Mail size={26} aria-hidden="true" />
          </span>
          <h2 className="font-display mt-4 text-2xl font-extrabold text-ink">Email us directly</h2>
          <p className="mt-2 text-ink-soft">
            The fastest way to reach the Snap Glow team is good old email.
          </p>
          <a
            href={`mailto:${EMAIL}`}
            className="btn-cta mt-6 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-display text-lg font-bold"
          >
            <Mail size={20} aria-hidden="true" /> {EMAIL}
          </a>
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <Clock size={16} aria-hidden="true" /> We aim to reply within 24 hours.
          </p>
          <div className="mt-6 border-t border-line pt-6">
            <p className="mb-3 text-sm font-extrabold uppercase tracking-wider text-ink-mute">Helpful links</p>
            <ul className="space-y-2 text-base font-semibold">
              <li>
                <Link to="/privacy" className="inline-flex items-center gap-2 text-brand-violet hover:underline">
                  <ShieldCheck size={16} aria-hidden="true" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="inline-flex items-center gap-2 text-brand-violet hover:underline">
                  <FileText size={16} aria-hidden="true" /> Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/guidelines" className="inline-flex items-center gap-2 text-brand-violet hover:underline">
                  <Sparkles size={16} aria-hidden="true" /> Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Form card */}
        <div className="card-surface rounded-card p-8">
          <h2 className="font-display text-2xl font-extrabold text-ink">Send us a message</h2>
          <p className="mt-2 rounded-2xl bg-mint px-4 py-3 text-sm font-semibold text-ink">
            This opens your email app with your message pre-filled — nothing is sent from or
            stored on our servers. The email is sent by you, from your own email address.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field name="name" label="Your name" placeholder="Jane Doe" autoComplete="name" />
            <Field name="email" label="Your email" type="email" placeholder="jane@example.com" autoComplete="email" />
            <SelectEl name="subject" label="Subject">
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </SelectEl>
            <TextArea name="message" label="Message" placeholder="Tell us what's on your mind…" rows={6} />
            <button
              type="submit"
              className="btn-cta inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-display text-lg font-bold"
            >
              <Mail size={20} aria-hidden="true" /> Open Email App to Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
