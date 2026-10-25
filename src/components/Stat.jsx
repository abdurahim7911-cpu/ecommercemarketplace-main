export function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">
      {tabs.map((t) => (
        <button key={t} onClick={() => onChange(t)} className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${value === t ? "bg-card shadow-card" : "text-muted-foreground"}`}>
          {t}
        </button>
      ))}
    </div>
  );
}
