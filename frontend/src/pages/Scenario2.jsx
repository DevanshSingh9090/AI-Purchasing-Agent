import { useState } from "react";

import ScenarioHeader from "../components/scenario/ScenarioHeader";
import ScenarioForm from "../components/scenario/ScenarioForm";
import AgentPipeline from "../components/scenario/AgentPipeline";

function Scenario2() {
  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [fulfilledQuantity, setFulfilledQuantity] = useState("250");

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
          scenario="2"
          title="Supplier Fulfillment Shortfall"
          description="Handle a supplier that cannot fulfill the original purchase order and determine the appropriate response using the same purchasing decision loop."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[380px_1fr]">
          <div>
            <ScenarioForm
              title="Supplier Shortfall"
              description="Provide the affected purchase order and the quantity the supplier can currently fulfill."
              onSubmit={handleSubmit}
              submitLabel="Run Shortfall Analysis"
            >
              <div>
                <label
                  htmlFor="purchaseOrder"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Purchase Order ID
                </label>

                <input
                  id="purchaseOrder"
                  type="text"
                  value={purchaseOrderId}
                  onChange={(event) => setPurchaseOrderId(event.target.value)}
                  placeholder="Enter purchase order ID"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="fulfilledQuantity"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Supplier Can Fulfill
                </label>

                <input
                  id="fulfilledQuantity"
                  type="number"
                  min="0"
                  value={fulfilledQuantity}
                  onChange={(event) =>
                    setFulfilledQuantity(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </ScenarioForm>
          </div>

          <div>
            <AgentPipeline currentStep={pipelineStep} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default Scenario2;