/** Light card colours from theme.css, taken in turn down a list of cards. */
export const CARD_COLOURS = [
  { card: "bg-card-yellow", accent: "text-card-yellow-accent", badge: "bg-card-yellow-badge text-card-yellow-badge-text" },
  { card: "bg-card-purple", accent: "text-card-purple-accent", badge: "bg-card-purple-badge text-card-purple-badge-text" },
  { card: "bg-card-sky", accent: "text-card-sky-accent", badge: "bg-card-sky-badge text-card-sky-badge-text" },
  { card: "bg-card-blue", accent: "text-card-blue-accent", badge: "bg-card-blue-badge text-card-blue-badge-text" },
  { card: "bg-card-green", accent: "text-card-green-accent", badge: "bg-card-green-badge text-card-green-badge-text" },
] as const;

/** The colour for the card at this place in its list. */
export function cardColour(position: number) {
  return CARD_COLOURS[position % CARD_COLOURS.length];
}
