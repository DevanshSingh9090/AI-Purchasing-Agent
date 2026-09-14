import { useEffect, useState } from "react";
import {
  ArrowRight,
  AlertTriangle,
  Brain,
  Check,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  Database,
  Loader2,
  Package,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { getDashboardData } from "../services/dashboardService";
import api from "../services/api";

function PipelineStep({ number, title, subtitle, status, icon: Icon }) {
  const isComplete = status === "complete";
  const isActive = status === "active";

  return (
    <div className="scenario-pipeline-step">
      <div
        className={`scenario-pipeline-icon ${
          isComplete ? "complete" : isActive ? "active" : ""
        }`}
      >
        {isComplete ? <Check size={17} /> : <Icon size={17} />}
      </div>

      <div className="scenario-pipeline-content">
        <div className="scenario-pipeline-number">
          0{number}
        </div>

        <div className="scenario-pipeline-title">{title}</div>

        <div className="scenario-pipeline-subtitle">{subtitle}</div>
      </div>
    </div>
  );
}

function EvidenceItem({ label, value }) {
  return (
    <div className="scenario-evidence-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Scenario1() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [recommendedQty, setRecommendedQty] = useState(800);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [running, setRunning] = useState(false);

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleApproval = async (approved) => {
    if (!result?.logId) return;

    try {
      setApprovalLoading(true);
      setError("");

      const endpoint = approved
        ? `/agent/approve/${result.logId}`
        : `/agent/reject/${result.logId}`;

      const response = await api.post(endpoint);

      setResult((prev) => ({
        ...prev,
        ...response.data,
        approvalStatus: response.data.approvalStatus,
        finalStatus: response.data.finalStatus,
        actionResult: approved
          ? {
              status: "executed",
              needsApproval: false,
              actionTaken:
                response.data.actionTaken,
            }
          : prev.actionResult,
        validationResult:
          response.data.validationResult ||
          prev.validationResult,
      }));
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.error ||
          "Unable to process approval."
      );
    } finally {
      setApprovalLoading(false);
    }
  };

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);

        const data = await getDashboardData();

        setProducts(data.products);

        if (data.products.length > 0) {
          setSelectedProduct(data.products[0]._id);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load products.");
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const runAgent = async () => {
    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }

    try {
      setError("");
      setRunning(true);
      setResult(null);

      const response = await api.post(
        "/agent/purchase-recommendation",
        {
          productId: selectedProduct,
          recommendedQty: Number(recommendedQty),
        }
      );

      setResult(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.error ||
          "Unable to run the purchase recommendation agent."
      );
    } finally {
      setRunning(false);
    }
  };

  const selectedProductData = products.find(
    (product) => product._id === selectedProduct
  );

  const decision = result?.decision;
  const evidence = result?.evidence;

  return (
    <div className="scenario-page">
      {/* Header */}
      <div className="scenario-header">
        <div>
          <div className="scenario-eyebrow">
            <span className="status-dot" />
            SCENARIO 01 · PURCHASE REVIEW
          </div>

          <h1>Purchase recommendation</h1>

          <p>
            Let the purchasing agent investigate operational evidence,
            evaluate the recommendation, and determine the safest action.
          </p>
        </div>

        <div className="scenario-status">
          <Sparkles size={16} />
          Agent ready
        </div>
      </div>

      {/* Main layout */}
      <div className="scenario-grid">
        {/* LEFT */}
        <div className="scenario-main-column">
          {/* Configuration */}
          <section className="scenario-card">
            <div className="scenario-card-header">
              <div>
                <div className="scenario-card-eyebrow">
                  WORKFLOW INPUT
                </div>

                <h2>Purchase request</h2>

                <p>
                  Provide the product and quantity you want the agent to
                  evaluate.
                </p>
              </div>

              <div className="scenario-card-icon">
                <Package size={19} />
              </div>
            </div>

            <div className="scenario-form">
              <div className="scenario-field">
                <label>Product</label>

                <div className="scenario-select-wrapper">
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    disabled={loadingProducts || running}
                  >
                    {loadingProducts ? (
                      <option>Loading products...</option>
                    ) : (
                      products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} · {product.sku}
                        </option>
                      ))
                    )}
                  </select>

                  <ChevronDown size={16} />
                </div>
              </div>

              <div className="scenario-field">
                <label>Recommended quantity</label>

                <input
                  type="number"
                  min="1"
                  value={recommendedQty}
                  onChange={(e) => setRecommendedQty(e.target.value)}
                  disabled={running}
                />

                <span className="scenario-field-hint">
                  Quantity proposed by the purchasing system.
                </span>
              </div>
            </div>

            {selectedProductData && (
              <div className="scenario-product-preview">
                <div>
                  <span>Current inventory</span>
                  <strong>
                    {selectedProductData.currentInventory} units
                  </strong>
                </div>

                <div>
                  <span>Unit cost</span>
                  <strong>
                    ${selectedProductData.unitCost}
                  </strong>
                </div>

                <div>
                  <span>Estimated purchase</span>
                  <strong>
                    $
                    {(
                      selectedProductData.unitCost *
                      Number(recommendedQty || 0)
                    ).toLocaleString()}
                  </strong>
                </div>
              </div>
            )}

            <button
              className="scenario-run-button"
              onClick={runAgent}
              disabled={running || loadingProducts}
            >
              {running ? (
                <>
                  <Loader2 size={17} className="spin" />
                  Agent is investigating...
                </>
              ) : (
                <>
                  <Zap size={17} />
                  Run purchasing agent
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            {error && (
              <div className="scenario-error">
                <CircleAlert size={17} />
                {error}
              </div>
            )}
          </section>

          {/* Pipeline */}
          <section className="scenario-card">
            <div className="scenario-card-header">
              <div>
                <div className="scenario-card-eyebrow">
                  AGENT EXECUTION
                </div>

                <h2>Decision pipeline</h2>

                <p>
                  Every decision passes through evidence, reasoning,
                  controlled action, and validation.
                </p>
              </div>
            </div>

            <div className="scenario-pipeline">
              <PipelineStep
                number={1}
                title="Investigate"
                subtitle="Gather evidence"
                status={result ? "complete" : "active"}
                icon={Database}
              />

              <div className="scenario-pipeline-line" />

              <PipelineStep
                number={2}
                title="Decide"
                subtitle="Reason over facts"
                status={result ? "complete" : ""}
                icon={Brain}
              />

              <div className="scenario-pipeline-line" />

              <PipelineStep
                number={3}
                title="Act"
                subtitle={
                  result
                    ? result.actionResult?.status ===
                      "pending_human_approval"
                      ? "Approval required"
                      : "Execute safely"
                    : "Execute safely"
                }
                status={
                  result
                    ? result.actionResult?.status ===
                      "pending_human_approval"
                      ? "active"
                      : "complete"
                    : ""
                }
                icon={Zap}
              />

              <div className="scenario-pipeline-line" />

              <PipelineStep
                number={4}
                title="Validate"
                subtitle={
                  result?.validationResult?.pending
                    ? "Waiting for action"
                    : "Verify outcome"
                }
                status={
                  result?.validationResult?.valid
                    ? "complete"
                    : ""
                }
                icon={ShieldCheck}
              />
            </div>
          </section>

          {/* Evidence */}
          {evidence && (
            <section className="scenario-card">
              <div className="scenario-card-header">
                <div>
                  <div className="scenario-card-eyebrow">
                    INVESTIGATION
                  </div>

                  <h2>Evidence collected</h2>

                  <p>
                    Operational data gathered before the agent made its
                    decision.
                  </p>
                </div>

                <div className="scenario-card-icon">
                  <Database size={19} />
                </div>
              </div>

              <div className="scenario-evidence-grid">
                <EvidenceItem
                  label="Product"
                  value={evidence.productName}
                />

                <EvidenceItem
                  label="Recommended"
                  value={`${evidence.recommendedQty} units`}
                />

                <EvidenceItem
                  label="Estimated cost"
                  value={`$${Number(
                    evidence.estimatedCost || 0
                  ).toLocaleString()}`}
                />

                <EvidenceItem
                  label="Inventory"
                  value={
                    evidence.inventory?.available ??
                    evidence.inventory?.currentInventory ??
                    "—"
                  }
                />

                <EvidenceItem
                  label="Demand"
                  value={
                    evidence.demandForecast?.forecast ??
                    evidence.demandForecast?.totalDemand ??
                    "—"
                  }
                />

                <EvidenceItem
                  label="Open POs"
                  value={
                    evidence.openPOs?.length ??
                    "—"
                  }
                />

                <EvidenceItem
                  label="Budget remaining"
                  value={
                    evidence.budget
                      ? `$${(
                          (evidence.budget.totalBudget -
                            evidence.budget.spentSoFar)
                        ).toLocaleString()}`
                      : "—"
                  }
                />

                <EvidenceItem
                  label="Storage remaining"
                  value={
                    evidence.storage
                      ? `${
                          evidence.storage.totalCapacity -
                          evidence.storage.usedCapacity
                        } units`
                      : "—"
                  }
                />
              </div>
            </section>
          )}
        </div>

        {/* RIGHT */}
        <aside className="scenario-side-column">
          {/* Decision */}
          <section className="scenario-card scenario-decision-card">
            <div className="scenario-card-eyebrow">
              DECISION ENGINE
            </div>

            <div className="scenario-decision-icon">
              <Brain size={22} />
            </div>

            {!decision ? (
              <>
                <h2>Awaiting analysis</h2>

                <p>
                  Run the agent to generate an evidence-backed
                  purchasing decision.
                </p>

                <div className="scenario-empty-state">
                  <ClipboardList size={20} />
                  <span>
                    Decision will appear here
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="scenario-decision-label">
                  RECOMMENDATION
                </div>

                <h2 className="scenario-decision-value">
                  {decision.decision?.toUpperCase()}
                </h2>

                {decision.modified_quantity && (
                  <div className="scenario-quantity">
                    <span>Adjusted quantity</span>
                    <strong>
                      {decision.modified_quantity} units
                    </strong>
                  </div>
                )}

                <div className="scenario-confidence">
                  <div>
                    <span>Confidence</span>
                    <strong>
                      {Math.round(
                        Number(decision.confidence || 0) * 100
                      )}
                      %
                    </strong>
                  </div>

                  <div className="scenario-confidence-bar">
                    <div
                      style={{
                        width: `${
                          Number(decision.confidence || 0) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {decision.reasons?.length > 0 && (
                  <div className="scenario-reasons">
                    <div className="scenario-section-label">
                      WHY
                    </div>

                    {decision.reasons.map((reason, index) => (
                      <div
                        className="scenario-reason"
                        key={index}
                      >
                        <Check size={15} />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Approval */}
          {result?.actionResult?.needsApproval &&
            result?.finalStatus === "awaiting_approval" && (
              <section className="scenario-approval-card">
                <div className="scenario-approval-title">
                  <AlertTriangle size={17} />
                  Human approval required
                </div>

                <p>
                  The agent has proposed a purchase action.
                  Review the recommendation before execution.
                </p>

                {result?.actionResult?.actionTaken && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "12px",
                      background: "white",
                      borderRadius: "10px",
                      border: "1px solid #fde68a",
                    }}
                  >
                    <strong style={{ fontSize: "13px" }}>
                      Proposed action
                    </strong>

                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "13px",
                        color: "#6b7280",
                      }}
                    >
                      Create purchase order for{" "}
                      <strong>
                        {result.actionResult.actionTaken.quantity}
                      </strong>{" "}
                      units.
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "15px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleApproval(false)}
                    disabled={approvalLoading}
                    style={{
                      flex: 1,
                      height: "42px",
                      borderRadius: "9px",
                      border: "1px solid #fecaca",
                      background: "#fff",
                      color: "#b91c1c",
                      fontWeight: 700,
                      cursor: approvalLoading
                        ? "not-allowed"
                        : "pointer",
                    }}
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApproval(true)}
                    disabled={approvalLoading}
                    style={{
                      flex: 1,
                      height: "42px",
                      borderRadius: "9px",
                      border: "none",
                      background: "#111827",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: approvalLoading
                        ? "not-allowed"
                        : "pointer",
                    }}
                  >
                    {approvalLoading
                      ? "Processing..."
                      : "Approve purchase"}
                  </button>
                </div>
              </section>
            )}

          {/* Status */}
          <section className="scenario-card scenario-status-card">
            <div className="scenario-card-eyebrow">
              WORKFLOW STATUS
            </div>

            <div className="scenario-status-row">
              <span>Status</span>

              <strong
                className={
                  result?.finalStatus === "awaiting_approval"
                    ? "status-pending"
                    : result
                    ? "status-success"
                    : ""
                }
              >
                {result
                  ? result.finalStatus ===
                    "awaiting_approval"
                    ? "Awaiting approval"
                    : result.finalStatus
                  : "Not started"}
              </strong>
            </div>

            {result?.logId && (
              <div className="scenario-log-id">
                Decision log: {result.logId}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}