import type { ComponentType, SVGProps } from "react";

type DoodleProps = SVGProps<SVGSVGElement>;

/** Shared outline style: thin rounded strokes in the surrounding text colour, hidden from screen readers. */
function Doodle({ children, ...props }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

function Pencil(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M14 66 20 48 56 12l12 12-36 36Z" />
      <path d="m50 18 12 12M20 48l12 12M14 66l6-2" />
      <path d="M60 62c4-3 8-2 10 1M54 70c6-1 10 0 14 2" />
    </Doodle>
  );
}

function Book(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M8 20c10-4 22-4 32 4 10-8 22-8 32-4v42c-10-4-22-4-32 4-10-8-22-8-32-4Z" />
      <path d="M40 24v42M16 30c6-2 12-2 18 1M16 38c6-2 12-2 18 1M46 31c6-3 12-3 18-1" />
    </Doodle>
  );
}

function LightBulb(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M40 12c-12 0-20 9-20 19 0 8 5 12 8 17 2 3 2 6 2 8h20c0-2 0-5 2-8 3-5 8-9 8-17 0-10-8-19-20-19Z" />
      <path d="M31 64h18M33 70h14M40 4v2M66 14l-2 2M14 14l2 2M72 34h-2M10 34h-2" />
    </Doodle>
  );
}

function PaperPlane(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M8 38 70 12 54 66 38 46Z" />
      <path d="m38 46 32-34M38 46v16l8-9" />
      <path d="M8 62c6 4 14 4 20-2" strokeDasharray="3 5" />
    </Doodle>
  );
}

function Flask(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M32 8h16M34 8v20L16 62c-2 5 1 10 7 10h34c6 0 9-5 7-10L46 28V8" />
      <path d="M24 50h32" />
      <circle cx="34" cy="60" r="3" />
      <circle cx="46" cy="56" r="2" />
    </Doodle>
  );
}

function Star(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="m40 10 8 18 20 2-15 13 5 20-18-11-18 11 5-20-15-13 20-2Z" />
      <path d="M66 60c2 2 2 6 0 8M12 60c-2 2-2 6 0 8" />
    </Doodle>
  );
}

/** Student-themed line drawings for decorating cards, taken in turn. */
export const DOODLES: readonly ComponentType<DoodleProps>[] = [Pencil, Book, LightBulb, PaperPlane, Flask, Star];
