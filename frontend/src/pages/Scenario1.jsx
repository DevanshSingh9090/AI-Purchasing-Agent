import { useState } from "react";

import ScenarioHeader from "../components/scenario/ScenarioHeader";
import ScenarioForm from "../components/scenario/ScenarioForm";
import AgentPipeline from "../components/scenario/AgentPipeline";
import EvidencePanel from "../components/scenario/EvidencePanel";

import DecisionCard from "../components/decision/DecisionCard";
import ReasonList from "../components/decision/ReasonList";
import ActionCard from "../components/decision/ActionCard";
import ValidationCard from "../components/decision/ValidationCard";

function Scenario1() {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("800");

  const [pipelineStep, setPipelineStep] = useState("investigate");

  const handleSubmit = (event) => {
    event.preventDefault();

    // API integration comes next.
    setPipelineStep("investigate");
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <ScenarioHeader
          scenario="1"
          title="Purchase Recommendation Review"
          description="Review a system-generated purchase recommendation and allow the purchasing agent to evaluate the relevant operational constraints before taking action."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[380px_1fr]">
          <div>
            <ScenarioForm
              title="Purchase Recommendation"
              description="Provide the recommendation that the agent should review."
              onSubmit={handleSubmit}
              submitLabel="Run Purchase Review"
            >
              <div>
                <label
                  htmlFor="product"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Product ID
                </label>

                <input
                  id="product"
                  type="text"
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  placeholder="Enter product ID"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Recommended Quantity
                </label>

                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </ScenarioForm>
          </div>

          <div>
            <AgentPipeline currentStep={pipelineStep} />
          </div>
        </div>

        {/* Results will appear here after API integration */}
        <div className="mt-6 space-y-6">
          <EvidencePanel evidence={null} />

          <DecisionCard decision={null} />

          <ReasonList reasons={[]} missingInformation={[]} />

          <ActionCard action={null} />

          <ValidationCard validation={null} />
        </div>
      </div>
    </main>
  );
}

export default Scenario1;