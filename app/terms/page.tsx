import Link from "next/link";
import type { Metadata } from "next";

import { BackMark } from "@/components/icons";

export const metadata: Metadata = {
  title: "Terms and privacy",
  description: "What EventBuddy collects, what it never collects, and how to delete it.",
};

const SECTIONS: { heading: string; paragraphs: string[] }[] = [
  {
    heading: "What this is",
    paragraphs: [
      "EventBuddy is a small, free tool built by two people so that invitees to Config India 2026 can find each other before the doors open on 15 October. It is not made by, affiliated with, or endorsed by Figma or the Config organisers.",
      "It exists for one day and one purpose. There is no company behind it and nothing here is sold.",
    ],
  },
  {
    heading: "What we take from LinkedIn",
    paragraphs: [
      "Signing in with LinkedIn is the only way in. LinkedIn hands us your name, your profile photo, your email address and an identifier that tells us it is the same you next time.",
      "Your email address stays in our authentication system. It is never shown to another attendee, and it is used only to send you the notifications described below.",
      "Your name and photo appear on your card so people can recognise you.",
    ],
  },
  {
    heading: "What you add yourself",
    paragraphs: [
      "What you do, your company, your city, your LinkedIn profile link, and one line about what you are hoping to get out of Config. All of it is optional except the invite question, all of it is editable in Settings, and all of it is visible to other signed-in invitees.",
      "Don't put anything on your card you would not say out loud in the hallway.",
    ],
  },
  {
    heading: "We never ask for your phone number",
    paragraphs: [
      "There is no phone number field anywhere in this app. We do not collect one, we do not store one, and there is nothing here that could share one. If you want to swap numbers with someone, do it yourselves, in person, when you have decided you want to.",
    ],
  },
  {
    heading: "Who can see what",
    paragraphs: [
      "Other signed-in invitees can see your card and the number of people who are interested in meeting you. They cannot see who those people are.",
      "You can see who tagged you. Tapping “Interested to meet” sends that person one email saying someone wants to meet them, with your name and headline. Undoing it is silent — no second email, no notification.",
      "Chat only opens when two people have each tapped the button. Nobody else can read those messages, and people who are not in the conversation cannot send into it.",
    ],
  },
  {
    heading: "Meeting people is on you",
    paragraphs: [
      "An “Interested to meet” is a signal, not an obligation. Nobody owes anybody a meeting, a reply, or their time. You are responsible for your own arrangements and your own safety: meet in the public areas of the venue, tell someone where you are going, and trust your gut.",
      "We are two people with a side project. We do not verify identities, we do not vet anyone, and we are not a party to anything that happens between you.",
    ],
  },
  {
    heading: "If something goes wrong",
    paragraphs: [
      "Every chat has Report and Block in its header. Blocking hides the two of you from each other everywhere in the app and closes the conversation immediately; the other person is not told. Reports are read by hand by us, and we will remove anyone who uses this to harass people.",
      "You can also undo an interest at any time, or dismiss someone from the list of people who tagged you.",
    ],
  },
  {
    heading: "Deleting everything",
    paragraphs: [
      "Settings → Delete my account removes your profile, every interest in both directions, your matches and your messages. It happens immediately and it cannot be undone.",
      "The whole thing is switched off shortly after the event anyway.",
    ],
  },
  {
    heading: "The boring part",
    paragraphs: [
      "This app is provided as-is, with no warranty of any kind. We are not liable for anything that follows from using it. We may change or switch it off at any time. If you do not agree with any of this, do not sign in.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 pt-5 pb-[calc(var(--footer-h)+3rem)]">
      <Link
        href="/"
        className="-ml-1.5 inline-flex items-center gap-1.5 rounded-lg p-1.5 text-[13px] text-muted transition-colors hover:text-paper"
      >
        <BackMark className="size-3.5" />
        Back
      </Link>

      <header className="mt-6 mb-9">
        <h1 className="font-display text-[2rem] leading-tight text-paper">Terms and privacy</h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
          In plain language, because you should be able to read this in two minutes.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-2.5 text-[15px] font-semibold tracking-[-0.01em] text-paper">
              {section.heading}
            </h2>
            <div className="flex flex-col gap-2.5">
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-[14px] leading-relaxed text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 border-t border-line-soft pt-5 text-[12.5px] text-muted-dim">
        Questions, or want your data gone without signing in? Message either of us on LinkedIn
        &mdash; the links are in the footer.
      </p>
    </main>
  );
}
