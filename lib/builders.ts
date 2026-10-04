/**
 * Shown in the footer on every page, and named in the terms.
 *
 * Copy elsewhere never assumes how many there are, so adding a second builder
 * back is a one-line change here and nothing else.
 */
export const builders = [
  {
    name: "Deepraj K",
    linkedin:
      "https://www.linkedin.com/in/deepraj-kalsekar-hfi-cua%E2%84%A2-811b4256",
  },
  // { name: "", linkedin: "" },
] as const;

export const builderNames = builders.map((b) => b.name).join(" and ");
