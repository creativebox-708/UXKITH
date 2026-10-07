/**
 * Server-only. This module holds the answers, so it must never be imported by
 * a client component — the page strips them before handing anything over.
 *
 * Everyone gets a different eight questions, in a different order, with the
 * options shuffled. The shuffle is seeded from the player's own id, so it is
 * the same every time it is worked out: the page and the grader derive the
 * identical set without storing it anywhere, and refreshing cannot re-roll a
 * harder draw into an easier one.
 */

export const QUIZ_LENGTH = 8;

type PoolItem = {
  emoji: string;
  q: string;
  /** The first option is the correct one here; both get shuffled per player. */
  options: [string, string, string, string];
  nugget: string;
};

const POOL: PoolItem[] = [
  {
    emoji: "📐",
    q: "Which shortcut wraps the selection in an Auto layout?",
    options: ["Shift + A", "Cmd/Ctrl + G", "Shift + L", "Cmd/Ctrl + Shift + A"],
    nugget: "Shift + A is the one shortcut that pays for itself before lunch.",
  },
  {
    emoji: "🧩",
    q: "What turns the selection into a component?",
    options: [
      "Cmd/Ctrl + Alt/Option + K",
      "Cmd/Ctrl + Shift + C",
      "Cmd/Ctrl + E",
      "Alt/Option + C",
    ],
    nugget: "K for… component. Nobody knows either.",
  },
  {
    emoji: "🪄",
    q: "Which prototype transition animates matching layers between two frames?",
    options: ["Smart Animate", "Dissolve", "Move In", "Instant"],
    nugget: "Matching layer names are what make Smart Animate look like magic.",
  },
  {
    emoji: "🗂️",
    q: "Variants of a component are grouped inside a…",
    options: ["Component set", "Frame set", "Variant group", "Style library"],
    nugget: "A component set is the purple dashed box holding every variant.",
  },
  {
    emoji: "✂️",
    q: "Union, Subtract, Intersect and Exclude are collectively called…",
    options: ["Boolean operations", "Vector merges", "Path filters", "Mask groups"],
    nugget: "They stay editable — you can always reopen the shapes inside.",
  },
  {
    emoji: "🖼️",
    q: "Which export format keeps artwork crisp at any size?",
    options: ["SVG", "PNG", "JPG", "WEBP"],
    nugget: "Vectors scale; pixels just get bigger and sadder.",
  },
  {
    emoji: "🧲",
    q: "Constraints decide how a layer behaves when…",
    options: [
      "Its parent frame is resized",
      "The file is exported",
      "A component is detached",
      "Someone else opens the file",
    ],
    nugget: "Left, right, centre, scale — the original responsive controls.",
  },
  {
    emoji: "🎨",
    q: "Figma's collaborative whiteboard product is called…",
    options: ["FigJam", "FigBoard", "Figma Flow", "Figma Canvas"],
    nugget: "Where the stickies go to live forever.",
  },
  {
    emoji: "👑",
    q: "The original that every instance points back to is the…",
    options: ["Main component", "Parent frame", "Root layer", "Base variant"],
    nugget: "Change the main component, every instance follows.",
  },
  {
    emoji: "🔢",
    q: "Which of these can a Figma variable NOT store?",
    options: ["A gradient", "A colour", "A number", "A boolean"],
    nugget: "Colour, number, string, boolean. Gradients still live in styles.",
  },
  {
    emoji: "🏗️",
    q: "Which key draws a frame?",
    options: ["F", "R", "A", "M"],
    nugget: "F for frame, R for rectangle — the two get mixed up daily.",
  },
  {
    emoji: "📋",
    q: "What does Cmd/Ctrl + D do?",
    options: ["Duplicates the selection", "Deletes it", "Detaches it", "Opens Dev Mode"],
    nugget: "Duplicate once, then repeat — Figma keeps the spacing.",
  },
  {
    emoji: "🔍",
    q: "Dev Mode mainly exists to…",
    options: [
      "Hand designs over to engineers",
      "Write plugin code",
      "Run accessibility audits",
      "Record prototypes",
    ],
    nugget: "Measurements, assets and code hints, without touching the design.",
  },
  {
    emoji: "🪆",
    q: "Turning an instance back into ordinary layers is called…",
    options: ["Detaching", "Flattening", "Rasterising", "Ungrouping"],
    nugget: "Detach breaks the link for good. Think twice.",
  },
  {
    emoji: "📏",
    q: "“Clip content” on a frame…",
    options: [
      "Hides anything outside the frame",
      "Locks the frame's size",
      "Removes empty layers",
      "Trims the export padding",
    ],
    nugget: "Off by default on some frames, which explains the mystery overflow.",
  },
  {
    emoji: "🅣",
    q: "Which key picks the text tool?",
    options: ["T", "X", "S", "W"],
    nugget: "T, then just start typing on the canvas.",
  },
  {
    emoji: "🧪",
    q: "Figma plugins are written in…",
    options: ["JavaScript / TypeScript", "Python", "Swift", "Rust"],
    nugget: "A sandboxed JS environment plus an HTML UI pane.",
  },
  {
    emoji: "♻️",
    q: "Reusable colours and text settings are saved as…",
    options: ["Styles", "Presets", "Tokens", "Themes"],
    nugget: "Styles were the original design tokens, long before variables.",
  },
  {
    emoji: "🏷️",
    q: "Which is NOT a component property type?",
    options: ["Shadow", "Boolean", "Text", "Instance swap"],
    nugget: "Boolean, text, instance swap and variant. Shadows stay effects.",
  },
  {
    emoji: "🤝",
    q: "Several people editing the same Figma file at once is…",
    options: ["Multiplayer", "Co-op mode", "Live share", "Branching"],
    nugget: "Those little cursors with names have a name of their own.",
  },
];

export type PublicQuestion = {
  emoji: string;
  q: string;
  options: string[];
};

/** Deterministic, so the same player always derives the same paper. */
function seedFrom(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type Paper = {
  questions: PublicQuestion[];
  /** Index of the right option in each shuffled question. Never sent down. */
  answers: number[];
};

export function paperFor(userId: string): Paper {
  const rand = mulberry32(seedFrom(userId));
  const picked = shuffled(POOL, rand).slice(0, QUIZ_LENGTH);

  const questions: PublicQuestion[] = [];
  const answers: number[] = [];

  for (const item of picked) {
    const correct = item.options[0];
    const options = shuffled(item.options, rand);
    questions.push({ emoji: item.emoji, q: item.q, options });
    answers.push(options.indexOf(correct));
  }

  return { questions, answers };
}

/** The bits worth reading back afterwards, in the player's own order. */
export function nuggetsFor(userId: string): string[] {
  const rand = mulberry32(seedFrom(userId));
  return shuffled(POOL, rand)
    .slice(0, QUIZ_LENGTH)
    .map((item) => item.nugget);
}
