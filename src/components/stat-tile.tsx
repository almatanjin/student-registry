import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TileColour = "blue" | "yellow" | "green" | "purple";

const COLOURS: Record<TileColour, { tile: string; icon: string }> = {
  blue: { tile: "bg-tile-blue", icon: "bg-tile-blue-icon" },
  yellow: { tile: "bg-tile-yellow", icon: "bg-tile-yellow-icon" },
  green: { tile: "bg-tile-green", icon: "bg-tile-green-icon" },
  purple: { tile: "bg-tile-purple", icon: "bg-tile-purple-icon" },
};

type StatTileProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  colour: TileColour;
  /** Where the detail behind this figure lives; leave out when there is no such page. */
  href?: string;
};

/** One figure on the staff dashboard, in a tile coloured from the PEN logo palette. */
export function StatTile({ label, value, detail, icon: Icon, colour, href }: StatTileProps) {
  const labelId = `tile-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <h2 id={labelId} className="text-sm font-medium">
          {label}
        </h2>
        <span
          aria-hidden
          className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-white", COLOURS[colour].icon)}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p data-slot="stat-value" className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-foreground/75">{detail}</p>
    </>
  );
  const surface = cn("block h-full rounded-xl p-4 text-foreground", COLOURS[colour].tile);

  return (
    <section aria-labelledby={labelId}>
      {href ? (
        <Link
          href={href}
          className={cn(surface, "transition-shadow outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50")}
        >
          {body}
        </Link>
      ) : (
        <div className={surface}>{body}</div>
      )}
    </section>
  );
}
