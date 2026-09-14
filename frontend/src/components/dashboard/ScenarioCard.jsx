import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../common/Card";

function ScenarioCard({
  number,
  title,
  description,
  trigger,
  href,
  status = "Available",
}) {
  return (
    <Card className="group flex h-full flex-col p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
          {number}
        </div>

        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          {status}
        </span>
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>

      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Trigger
        </p>

        <p className="mt-1 text-sm text-slate-600">{trigger}</p>
      </div>

      <Link
        to={href}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
      >
        Run scenario
        <ArrowRight
          size={16}
          className="transition-transform group-hover:translate-x-1"
        />
      </Link>
    </Card>
  );
}

export default ScenarioCard;