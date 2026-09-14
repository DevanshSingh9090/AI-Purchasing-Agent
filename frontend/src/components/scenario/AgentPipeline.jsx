import {
  Search,
  Brain,
  Play,
  ShieldCheck,
  Check,
  LoaderCircle,
} from "lucide-react";

const steps = [
  {
    key: "investigate",
    label: "Investigate",
    description: "Gather evidence",
    icon: Search,
  },
  {
    key: "decide",
    label: "Decide",
    description: "Evaluate constraints",
    icon: Brain,
  },
  {
    key: "act",
    label: "Act",
    description: "Execute decision",
    icon: Play,
  },
  {
    key: "validate",
    label: "Validate",
    description: "Check actual state",
    icon: ShieldCheck,
  },
];

function getStepState(stepKey, currentStep) {
  const currentIndex = steps.findIndex((step) => step.key === currentStep);
  const stepIndex = steps.findIndex((step) => step.key === stepKey);

  if (currentStep === "completed") {
    return "completed";
  }

  if (currentStep === "error") {
    return stepIndex <= currentIndex ? "completed" : "pending";
  }

  if (stepIndex < currentIndex) {
    return "completed";
  }

  if (stepIndex === currentIndex) {
    return "active";
  }

  return "pending";
}

function AgentPipeline({ currentStep = "investigate" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="font-bold text-slate-900">Agent Execution</h2>
        <p className="mt-1 text-sm text-slate-500">
          The agent follows a controlled decision pipeline.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {steps.map((step, index) => {
          const state = getStepState(step.key, currentStep);
          const Icon = step.icon;

          return (
            <div key={step.key} className="relative">
              {index < steps.length - 1 && (
                <div className="absolute left-[calc(50%+24px)] right-[calc(-50%+24px)] top-6 hidden h-px bg-slate-200 md:block" />
              )}

              <div className="relative flex flex-col items-center text-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                    state === "completed"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                      : state === "active"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {state === "completed" ? (
                    <Check size={20} />
                  ) : state === "active" ? (
                    <LoaderCircle size={20} className="animate-spin" />
                  ) : (
                    <Icon size={20} />
                  )}
                </div>

                <p
                  className={`mt-3 text-sm font-semibold ${
                    state === "pending"
                      ? "text-slate-400"
                      : "text-slate-900"
                  }`}
                >
                  {step.label}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AgentPipeline;