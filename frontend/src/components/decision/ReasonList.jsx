import { CheckCircle2, AlertCircle } from "lucide-react";
import Card from "../common/Card";

function ReasonList({ reasons = [], missingInformation = [] }) {
  if (!reasons.length && !missingInformation.length) {
    return null;
  }

  return (
    <Card className="p-6">
      {reasons.length > 0 && (
        <div>
          <h2 className="font-bold text-slate-900">Why this decision?</h2>

          <div className="mt-4 space-y-3">
            {reasons.map((reason, index) => (
              <div key={index} className="flex gap-3">
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-500"
                />

                <p className="text-sm leading-6 text-slate-600">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {missingInformation.length > 0 && (
        <div className={reasons.length > 0 ? "mt-7 border-t border-slate-100 pt-6" : ""}>
          <h2 className="font-bold text-slate-900">Missing Information</h2>

          <div className="mt-4 space-y-3">
            {missingInformation.map((item, index) => (
              <div key={index} className="flex gap-3">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-500"
                />

                <p className="text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default ReasonList;