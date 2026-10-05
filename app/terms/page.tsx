import Link from "next/link";
import type { Metadata } from "next";

import { BackMark } from "@/components/icons";
import { Wordmark } from "@/components/wordmark";
import { builderNames } from "@/lib/builders";
import { EVENT } from "@/lib/event";

export const metadata: Metadata = {
  title: "Terms and privacy",
  description: "What thedesignvibe collects, what it never collects, and how to delete it.",
};

/** Shown at the top so nobody has to guess which version they agreed to. */
const LAST_UPDATED = "4 October 2026";

type Section = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  afterBullets?: string[];
};

const SECTIONS: Section[] = [
  {
    heading: "The short version",
    bullets: [
      "This is a free side project, not a company and not a product.",
      "It is not made by, affiliated with, endorsed by or connected to Figma, the organisers of Config, or any Figma community or chapter.",
      "It is strictly professional. It is not a dating app, not a matchmaking service, and not a job board.",
      "We never ask for, store or share a phone number.",
      "An “Interested to meet” is a signal, not an obligation. Meeting anyone is your own decision, taken entirely at your own risk.",
      "Harassment of any kind gets you removed. Write to people the way you would speak to them standing in the same room, because shortly you might be.",
      "You can delete everything about yourself in two taps, and the whole thing is switched off shortly after the event anyway.",
    ],
  },
  {
    heading: "Who is behind this",
    paragraphs: [
      `thedesignvibe is built and run in spare time by ${builderNames}, who will be at the same event as you. It is a hobby project. There is no company, no team, no funding, no office and no support desk.`,
      "Nobody is paid for it, nothing is sold, there are no ads, no trackers, no analytics on your behaviour, and your information is never sold, rented, licensed or shared with advertisers or data brokers. There is no business model here because there is no business.",
      "We are not professionals operating a service. Please calibrate your expectations accordingly: it may break, it may be slow, and it may go away.",
    ],
  },
  {
    heading: "Not affiliated with Figma, or with any Figma community",
    paragraphs: [
      "Figma, Config and any related names and logos belong to their respective owners. We use the name of the event only to say which event this tool is for. We do not use their logos or brand assets, we do not speak for them, and nothing here is official.",
      "That includes the community side of it. We are not a Friends of Figma chapter, not a watch party, not a community partner and not a volunteer programme. We do not represent, organise, promote, endorse or speak for any Figma community, chapter, meetup or programme, and none of them have endorsed us.",
      `For anything official — the agenda, tickets, the venue, who is speaking — go to ${EVENT.officialUrl}. If a rights holder would like something here changed or taken down, tell us on LinkedIn and we will do it promptly.`,
    ],
  },
  {
    heading: "What this is not",
    paragraphs: [
      "This is a tool for working out who you want to find in a crowd of a few thousand people, and for saying hello first. That is the whole of it.",
      "It is not a dating or matchmaking app. There is no romance here. Do not use it to ask anyone out, to comment on how anyone looks, or to pursue anything other than a professional conversation. If that is what you came for, you are in the wrong place, and you will be removed.",
      "It is not a job board or a recruitment tool. We do not host, promote or facilitate job postings, hiring, headhunting, or paid promotion of any kind. Two people who both wanted to meet and end up talking about work is exactly the point; cold recruiting, pitching openings at strangers, or working through the list as a candidate pipeline is not.",
      "It is not a directory, a lead list, an advertising channel or a mailing list, and it must not be treated as one.",
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
      "Signing in with LinkedIn is the only way in, and it is there for one reason: it ties every card to a real, professional identity that the person already maintains in public. It is not there so anyone can mine it.",
      "Through LinkedIn's standard OpenID Connect sign-in we receive your name, your profile photo, your email address and an identifier that tells us it is the same you next time. That is the entire list — LinkedIn does not give us your connections, your messages, your employment history or your activity, and we do not ask for them.",
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
      "Phone numbers. There is no field for one anywhere in the app, and there never will be.",
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
    heading: "Meeting people is your decision, and your risk",
    paragraphs: [
      "This is the part that matters most, so it is worth saying slowly. We introduce nothing and vouch for nobody. We do not verify identities, we do not run background checks, we do not vet, screen, moderate or supervise anyone, and we are not a party to anything that happens between you and another person.",
      "Nobody owes anybody a meeting, a reply, or their time. Ignoring an interest is a perfectly good answer, and so is changing your mind at any point.",
      "If you do choose to meet someone, that decision and everything that follows from it is yours alone. Meet in the public areas of the venue, in daylight, with people around. Tell somebody where you are going. Do not go anywhere private with someone you have just met. Trust your instincts, and leave the moment you want to.",
      "We are not responsible for anything that happens to you, or because of you, through using this tool — before, during or after the event, online or in person. To the fullest extent the law allows we accept no responsibility or liability for any meeting, message, conversation, conduct, loss, injury, distress or harm arising from it. You use it entirely at your own risk.",
    ],
  },
  {
    heading: "Chat responsibly",
    paragraphs: [
      "There is a real person at the other end. They can see your name, your face and your LinkedIn, and within a fortnight the two of you may be standing in the same room. Write accordingly.",
      "Keep it professional and keep it short. A first message that would be strange to say out loud at a conference is strange here too. If somebody stops replying, that is their answer; let it go.",
      "There is no tolerance for harassment of any kind. That includes sexual harassment and unwanted sexual or romantic attention of every sort — what is often called eve-teasing — remarks about someone's body, face or clothes, messaging on after someone has gone quiet, dismissed you or blocked you, and following or approaching anyone in person who has not agreed to meet you.",
      "Any of that and your access goes, without warning and without explanation. Where it looks like a crime, we will cooperate fully with venue security and the police, and we will hand over what we hold if they lawfully ask for it.",
    ],
  },
  {
    heading: "How you must behave",
    paragraphs: ["Use it to find people you would like to meet. Do not use it to:"],
    bullets: [
      "harass, threaten, stalk, intimidate or abuse anyone",
      "make romantic or sexual advances, or comment on how anyone looks",
      "keep contacting someone who has stopped replying, dismissed you or blocked you",
      "recruit, headhunt, pitch job openings, or advertise or sell anything",
      "send spam, chain messages, or the same message to lots of people",
      "impersonate anyone, or misrepresent who you are or who you work for",
      "scrape, crawl, bulk-export or republish anyone's details, or build a mailing list from them",
      "attempt to break, overload, probe or gain unauthorised access to any part of the service",
      "post anything unlawful, hateful, sexually explicit or otherwise obviously out of place at a professional event",
    ],
    afterBullets: [
      "We may remove anyone's access at any time, for any reason, without notice or explanation, and we do not owe anyone an appeal.",
    ],
  },
  {
    heading: "If something goes wrong",
    paragraphs: [
      "Every chat has Report and Block in its header. Blocking hides the two of you from each other everywhere in the app and closes the conversation immediately; the other person is not told. You can also undo an interest at any time, or dismiss someone from the list of people who tagged you.",
      "Reports are read by hand by us, when we are able to. This is a side project run around a day job, not a trust-and-safety team, and we cannot promise to see or act on anything quickly.",
      "If you are in danger, or something has happened that needs more than a Block button, contact venue security or the police. We are not an emergency service and we cannot help in the moment.",
    ],
  },
  {
    heading: "No promises, and limits on liability",
    paragraphs: [
      "The service is provided “as is” and “as available”, with no warranties of any kind, express or implied, including any implied warranties of merchantability, fitness for a particular purpose, accuracy or non-infringement. We do not promise it will work, stay up, be free of errors, be secure, or that anything in it is accurate.",
      "To the fullest extent permitted by law, we are not liable for any indirect, incidental, special, consequential or punitive damages, or for any loss of data, profit, opportunity, goodwill or reputation, arising out of or connected with your use of the service — whether or not we were told such damages were possible.",
      "Where liability cannot lawfully be excluded, it is limited to one hundred rupees (₹100). You have paid us nothing, and this is a free tool given away in good faith.",
      "You agree to cover us for any claim brought against us because of your own conduct, your own content, or your own breach of these terms.",
      "Nothing here limits liability for fraud, or for anything else that cannot be limited under applicable law.",
    ],
  },
  {
    heading: "Your rights over your information",
    paragraphs: [
      "You can see everything we hold about you in the app itself: it is your card and your messages. You can correct any of it in Settings, and you can erase all of it with Delete my account.",
      "If you would rather not do it yourself, or you want something removed without signing in, message us on LinkedIn — see the footer of every page — and we will deal with it. If you are unhappy with how we have handled a request, say so and we will try to put it right.",
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
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="-ml-1.5 inline-flex items-center gap-1.5 rounded-lg p-1.5 text-[13px] text-muted transition-colors hover:text-paper"
        >
          <BackMark className="size-3.5" />
          Back
        </Link>
        <Wordmark href="/" muted />
      </div>

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

              {section.afterBullets?.map((paragraph, i) => (
                <p key={i} className="text-[14px] leading-relaxed text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 border-t border-line-soft pt-5 text-[12.5px] leading-relaxed text-muted-dim">
        Questions, a takedown request, or want your data gone without signing in? Message either of
        us on LinkedIn &mdash; see the footer of every page.
      </p>
    </main>
  );
}
