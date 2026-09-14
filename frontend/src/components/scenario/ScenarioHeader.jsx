import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function ScenarioHeader({ scenario, title, description }) {
  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      <div className="mt-6">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
            SCENARIO {scenario}
          </span>

          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            AI Purchasing Agent
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

export default ScenarioHeader;