import { Brain } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import { formatDecision } from "../../utils/formatters";

function getDecisionVariant(decision) {
  switch (decision) {
    case "accept":
      return "success";
    case "modify":
      return "warning";
    case "reject":
      return "danger";
    case "investigate":
      return "info";
    default:
      return "neutral";
  }
}

function DecisionCard({ decision }) {
  if (!decision) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
          <Brain size={20} />
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Agent Decision</h2>

              <p className="mt-1 text-sm text-slate-500">
                Structured decision produced from gathered evidence.
              </p>
            </div>

            <Badge variant={getDecisionVariant(decision.decision)}>
              {formatDecision(decision.decision)}
            </Badge>
          </div>

          {decision.confidence !== undefined && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">
                  Confidence
                </span>

                <span className="font-bold text-slate-900">
                  {Math.round(Number(decision.confidence) * 100)}%
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{
                    width: `${Math.min(
                      Math.max(Number(decision.confidence) * 100, 0),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {decision.modified_quantity !== undefined &&
            decision.modified_quantity !== null && (
              <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                  Modified Quantity
                </p>

                <p className="mt-1 text-xl font-bold text-amber-900">
                  {decision.modified_quantity}
                </p>
              </div>
            )}
        </div>
      </div>
    </Card>
  );
}

export default DecisionCard;