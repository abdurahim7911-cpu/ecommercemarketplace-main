import { STATUS_FLOW } from "@/lib/shop";
import { Check, X } from "lucide-react";

const tone = {
  pending: "bg-warning/20 text-foreground",
  confirmed: "bg-info/15 text-info",
  processing: "bg-info/25 text-info",
  shipped: "bg-primary/15 text-primary",
  delivered: "bg-success/20 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone[status]}`}>
      {status}
    </span>
  );
}

export function OrderTimeline({ status }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
        <X className="h-4 w-4" /> This order was cancelled.
      </div>
    );
  }
  const idx = STATUS_FLOW.indexOf(status);
  return (
    <ol className="flex items-center gap-1">
      {STATUS_FLOW.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full items-center">
            <div className={`h-1 flex-1 ${i === 0 ? "opacity-0" : i <= idx ? "bg-primary" : "bg-border"}`} />
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i <= idx ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <div className={`h-1 flex-1 ${i === STATUS_FLOW.length - 1 ? "opacity-0" : i < idx ? "bg-primary" : "bg-border"}`} />
          </div>
          <span className="text-[11px] capitalize text-muted-foreground">{s}</span>
        </li>
      ))}
    </ol>
  );
}
