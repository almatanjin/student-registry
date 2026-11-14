/** A two-column list of labelled values, used on record pages. */
export function DetailList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="grid gap-1">
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className="font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
