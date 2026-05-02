// Border radius scale — derived from Tailwind defaults used by STORIX-FE-2.0.
// rounded=4, rounded-lg=8, rounded-xl=12, rounded-2xl=16, rounded-full=9999

export const Radius = {
  xs:   4,    // rounded     — small badges, tags
  sm:   8,    // rounded-lg  — inputs, small cards
  md:   12,   // rounded-xl  — cards, panels
  lg:   16,   // rounded-2xl — modal sheets, hero cards
  xl:   20,   // pill inputs, large buttons
  full: 9999, // rounded-full — avatar circles, pills
} as const
