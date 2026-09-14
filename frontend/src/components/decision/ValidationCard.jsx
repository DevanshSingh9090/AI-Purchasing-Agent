import { ShieldCheck, ShieldAlert } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";

function ValidationCard({ validation }) {
  if (!validation) {
    return null;
  }

  const isValid =
    validation.valid ??
    validation.isValid ??
    validation.success ??
    validation.status === "valid";

  return (
    <Card
      className={`p-6 ${
        isValid ? "border-emerald-200" : "border-red-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`rounded-lg p-2 ${
            isValid
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {isValid ? (
            <ShieldCheck size={20} />
          ) : (
            <ShieldAlert size={20} />
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Validation Result</h2>

              <p className="mt-1 text-sm text-slate-500">
                Actual resulting state checked against purchasing constraints.
              </p>
            </div>

            <Badge variant={isValid ? "success" : "danger"}>
              {isValid ? "VALID" : "INVALID"}
            </Badge>
          </div>

          <div className="mt-5 space-y-3">
            {Object.entries(validation).map(([key, value]) => {
              if (
                key === "valid" ||
                key === "isValid" ||
                key === "success"
              ) {
                return null;
              }

              return (
                <div
                  key={key}
                  className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-sm capitalize text-slate-500">
                    {key.replaceAll("_", " ")}
                  </span>

                  <span className="max-w-[65%] text-right text-sm font-medium text-slate-800">
                    {typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ValidationCard;