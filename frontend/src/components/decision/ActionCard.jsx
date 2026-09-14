import { PlayCircle } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import { formatCurrency, formatNumber } from "../../utils/formatters";

function ActionCard({ action }) {
  if (!action) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <PlayCircle size={20} />
        </div>

        <div className="flex-1">
          <h2 className="font-bold text-slate-900">Action Taken</h2>

          <p className="mt-1 text-sm text-slate-500">
            The action executed after the agent's decision.
          </p>

          <div className="mt-5 space-y-3">
            {Object.entries(action).map(([key, value]) => {
              if (value === null || value === undefined) {
                return null;
              }

              let displayValue = value;

              if (
                key.toLowerCase().includes("cost") ||
                key.toLowerCase().includes("budget")
              ) {
                displayValue = formatCurrency(value);
              } else if (typeof value === "number") {
                displayValue = formatNumber(value);
              }

              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-sm capitalize text-slate-500">
                    {key.replaceAll("_", " ")}
                  </span>

                  {typeof displayValue === "boolean" ? (
                    <Badge variant={displayValue ? "success" : "danger"}>
                      {displayValue ? "Yes" : "No"}
                    </Badge>
                  ) : (
                    <span className="text-sm font-semibold text-slate-900">
                      {String(displayValue)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ActionCard;