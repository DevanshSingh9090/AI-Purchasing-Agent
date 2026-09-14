import { Database } from "lucide-react";
import Card from "../common/Card";
import { formatCurrency, formatNumber } from "../../utils/formatters";

function EvidenceValue({ label, value, type }) {
  let displayValue = value;

  if (type === "currency") {
    displayValue = formatCurrency(value);
  }

  if (type === "number") {
    displayValue = formatNumber(value);
  }

  if (value === null || value === undefined || value === "") {
    displayValue = "—";
  }

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold text-slate-900">
        {displayValue}
      </p>
    </div>
  );
}

function EvidencePanel({ evidence }) {
  if (!evidence) {
    return null;
  }

  const entries = Object.entries(evidence);

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <Database size={20} />
        </div>

        <div>
          <h2 className="font-bold text-slate-900">Evidence Gathered</h2>

          <p className="mt-1 text-sm text-slate-500">
            Facts collected before the agent makes its decision.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([key, value]) => {
          if (typeof value === "object" && value !== null) {
            return (
              <div
                key={key}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4 sm:col-span-2 lg:col-span-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {key}
                </p>

                <pre className="mt-2 overflow-x-auto text-xs text-slate-700">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            );
          }

          const lowerKey = key.toLowerCase();

          const type = lowerKey.includes("budget") || lowerKey.includes("cost")
            ? "currency"
            : typeof value === "number"
            ? "number"
            : undefined;

          return (
            <EvidenceValue
              key={key}
              label={key.replaceAll("_", " ")}
              value={value}
              type={type}
            />
          );
        })}
      </div>
    </Card>
  );
}

export default EvidencePanel;