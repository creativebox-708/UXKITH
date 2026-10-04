import Link from "next/link";
import type { Metadata } from "next";

import { BackMark } from "@/components/icons";
import { builders } from "@/lib/builders";
import { EVENT } from "@/lib/event";

export const metadata: Metadata = {
  title: "Terms and privacy",
  description: "What EventBuddy collects, what it never collects, and how to delete it.",
};

/** Shown at the top so nobody has to guess which version they agreed to. */
const LAST_UPDATED = "4 October 2026";

type Section = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

const SECTIONS: Section[] = [
  {
    heading: "The short version",
    bullets: [
      "This is a free side project by two people, not a company and not a product.",
      "It is not made by, affiliated with, endorsed by or connected to Figma or the organisers of Config in any way.",
      "We never ask for, store or share a phone number.",
      "An “Interested to meet” is a signal, not an obligation, and meeting anyone is entirely your own decision and your own risk.",
      "You can delete everything about yourself in two taps, and the whole thing is switched off shortly after the event anyway.",
    ],
  },
  {
    heading: "Who is behind this",
    paragraphs: [
      `EventBuddy is built and run in their own spare time by ${builders.map((b) => b.name).join(" and ")}, two people attending the same event as you. It is a hobby project. There is no company, no team, no funding, no office and no support desk.`,
      "Nobody is paid for it, nothing is sold, there are no ads, no trackers, no analytics on your behaviour, and your information is never sold, rented, licensed or shared with advertisers or data brokers. There is no business model here because there is no business.",
      "We are not professionals operating a service. Please calibrate your expectations accordingly: it may break, it may be slow, and it may go away.",
    ],
  },
  {
    heading: "Not affiliated with Figma",
    paragraphs: [
      "Figma, Config and any related names and logos belong to their respective owners. We use the name of the event only to say which event this tool is for. We do not use their logos or brand assets, we do not speak for them, and nothing here is official.",
      `For anything official — the agenda, tickets, the venue, who is speaking — go to ${EVENT.officialUrl}. If a rights holder would like something here changed or taken down, tell either of us on LinkedIn and we will do it promptly.`,
    ],
  },
  {
    heading: "Who may use it",
    paragraphs: [
      "You must be 18 or over, and you must be a genuine invitee to the event. The invite question is on your honour; we have no way of checking it and we do not try to.",
      "One account per person. Do not sign in as somebody else, do not impersonate anyone, and do not create accounts for people who have not asked for one.",
    ],
  },
  {
    heading: "What we take from LinkedIn",
    paragraphs: [
      "Signing in with LinkedIn is the only way in. Through LinkedIn's standard OpenID Connect sign-in, we receive your name, your profile photo, your email address and an identifier that tells us it is the same you next time. That is the entire list — LinkedIn does not give us your connections, your messages, your employment history or your activity, and we do not ask for them.",
      "Your email address is held by our authentication provider and is used for one thing: the notifications described below. It is never shown to another attendee and never shared with anyone.",
      "Your name and photo appear on your card so that people can recognise you on the day.",
    ],
  },
  {
    heading: "What you add yourself",
    paragraphs: [
      "What you do, your company, your city, a link to your LinkedIn profile, and one line about what you are hoping to get out of the event. All of it is optional, all of it is editable in Settings, and all of it is visible to other signed-in invitees.",
      "Put nothing on your card you would not say out loud in a hallway. You are responsible for what you choose to publish about yourself.",
    ],
  },
  {
    heading: "What we never collect",
    bullets: [
      "Phone numbers. There is no field for one anywhere in the app.",
      "Payment details of any kind.",
      "Your location, at any level of precision. No GPS, no Bluetooth, no check-ins.",
      "Your contacts, your calendar or anything else on your device.",
      "Behavioural analytics, advertising identifiers or third-party tracking cookies.",
    ],
  },
  {
    heading: "Who can see what",
    paragraphs: [
      "Other signed-in invitees can see your card, and the number of people interested in meeting you. They cannot see who those people are.",
      "You can see who tagged you. Tapping “Interested to meet” sends that person one email saying someone wants to meet them, with your name and headline. Undoing it is silent — no second email, no notification, and they are not told.",
      "Chat opens only when two people have each tapped the button. Nobody outside that pair can read those messages, and nobody outside it can send into the conversation.",
    ],
  },
  {
    heading: "How long we keep it, and deletion",
    paragraphs: [
      "Settings → Delete my account removes your profile, every interest in both directions, your matches and your messages. It happens immediately and it cannot be undone.",
      "The service is shut down and its data deleted shortly after the event. This is a tool for one day, not a database we are building.",
      "Messages you have sent sit in the other person's conversation as well as yours. Deleting your account removes them.",
    ],
  },
  {
    heading: "Meeting people is your decision",
    paragraphs: [
      "This is the part that matters most, so it is worth saying slowly. We introduce nothing and vouch for nobody. We do not verify identities, we do not run background checks, we do not vet, screen, moderate or supervise anyone, and we are not a party to anything that happens between you and another person.",
      "Nobody owes anybody a meeting, a reply, or their time. Ignoring an interest is a perfectly good answer.",
      "If you do choose to meet someone, that decision and everything that follows from it is yours alone. Meet in the public areas of the venue, tell somebody where you are going, and trust your instincts. To the fullest extent the law allows, we accept no responsibility or liability for any meeting, conversation, conduct, loss, injury or harm arising from your use of this tool.",
    ],
  },
  {
    heading: "How you must behave",
    paragraphs: ["Use it to find people you would like to meet. Do not use it to:"],
    bullets: [
      "harass, threaten, stalk, abuse or intimidate anyone, or contact someone who has made it clear they are not interested",
      "send spam, advertising, recruitment blasts or chain messages",
      "impersonate another person, or misrepresent who you are or who you work for",
      "scrape, crawl, bulk-export or republish anyone's details, or build a mailing list from them",
      "attempt to break, overload, probe or gain unauthorised access to any part of the service",
      "post anything unlawful, hateful, sexually explicit or otherwise obviously out of place at a professional event",
    ],
  },
  {
    heading: "If something goes wrong",
    paragraphs: [
      "Every chat has Report and Block in its header. Blocking hides the two of you from each other everywhere in the app and closes the conversation immediately; the other person is not told. You can also undo an interest at any time, or dismiss someone from the list of people who tagged you.",
      "Reports are read by hand by us, when we are able to, and we may remove anyone's access at any time for any reason, without notice or explanation. We are two people with day jobs, not a trust-and-safety team, and we cannot promise to see or act on anything quickly.",
      "If you are in danger, contact venue security or the police. We are not an emergency service and cannot help.",
    ],
  },
  {
    heading: "No promises, and limits on liability",
    paragraphs: [
      "The service is provided “as is” and “as available”, with no warranties of any kind, express or implied, including any implied warranties of merchantability, fitness for a particular purpose, accuracy or non-infringement. We do not promise it will work, stay up, be free of errors, be secure, or that anything in it is accurate.",
      "To the fullest extent permitted by law, neither of us is liable for any indirect, incidental, special, consequential or punitive damages, or for any loss of data, profit, opportunity, goodwill or reputation, arising out of or connected with your use of the service — whether or not we were told such damages were possible.",
      "Where liability cannot lawfully be excluded, it is limited to one hundred rupees (₹100). You have paid us nothing, and this is a free tool given away in good faith.",
      "You agree to cover us for any claim brought against us because of your own conduct, your own content, or your own breach of these terms.",
      "Nothing here limits liability for fraud, or for anything else that cannot be limited under applicable law.",
    ],
  },
  {
    heading: "Your rights over your information",
    paragraphs: [
      "You can see everything we hold about you in the app itself: it is your card and your messages. You can correct any of it in Settings, and you can erase all of it with Delete my account.",
      "If you would rather not do it yourself, or you want something removed without signing in, message either of us on LinkedIn — the links are in the footer of every page — and we will deal with it. If you are unhappy with how we have handled a request, say so and we will try to put it right.",
    ],
  },
  {
    heading: "Changes, and switching it off",
    paragraphs: [
      "We may change these terms, change how the app works, or shut the whole thing down at any time, for any reason, without notice. If we change anything significant before the event we will update the date at the top of this page.",
      "Continuing to use it after a change means you accept the change. If you do not, delete your account.",
    ],
  },
  {
    heading: "Law",
    paragraphs: [
      "These terms are governed by the laws of India, and the courts at Bengaluru have exclusive jurisdiction over any dispute. If any part of these terms turns out to be unenforceable, the rest still applies.",
      "If you do not agree with any of this, please do not sign in.",
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
          In plain language, because you should be able to read this in a few minutes.
        </p>
        <p className="mt-3 text-[12px] text-muted-dim">Last updated {LAST_UPDATED}</p>
      </header>

      <div className="flex flex-col gap-8">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-2.5 text-[15px] font-semibold tracking-[-0.01em] text-paper">
              {section.heading}
            </h2>

            <div className="flex flex-col gap-2.5">
              {section.paragraphs?.map((paragraph, i) => (
                <p key={i} className="text-[14px] leading-relaxed text-muted">
                  {paragraph}
                </p>
              ))}

              {section.bullets && (
                <ul className="flex flex-col gap-2">
                  {section.bullets.map((bullet, i) => (
                    <li
                      key={i}
                      className="relative pl-4 text-[14px] leading-relaxed text-muted before:absolute before:top-[0.6em] before:left-0 before:size-1 before:rounded-full before:bg-muted-dim"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 border-t border-line-soft pt-5 text-[12.5px] leading-relaxed text-muted-dim">
        Questions, a takedown request, or want your data gone without signing in? Message either of
        us on LinkedIn &mdash; the links are in the footer of every page.
      </p>
    </main>
  );
}
