import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  ClipboardList,
  Package,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";

function PipelineStep({ icon: Icon, title, active, complete }) {
  return (
    <div
      className={`scenario-pipeline-step ${
        active ? "active" : ""
      } ${complete ? "complete" : ""}`}
    >
      <div className="scenario-pipeline-icon">
        {complete ? <CheckCircle2 size={17} /> : <Icon size={17} />}
      </div>

      <strong>{title}</strong>

      <span>
        {complete ? "Complete" : active ? "Processing" : "Waiting"}
      </span>
    </div>
  );
}

export default function Scenario2() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState("");
  const [fulfilledQty, setFulfilledQty] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPOs = async () => {
      try {
        setLoading(true);

        const response = await api.get("/pos");

        setPurchaseOrders(response.data);

        if (response.data.length > 0) {
          setSelectedPO(response.data[0]._id);

          const po = response.data[0];

          setFulfilledQty(
            po.confirmedQuantity != null
              ? po.confirmedQuantity
              : 0
          );
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load purchase orders.");
      } finally {
        setLoading(false);
      }
    };

    loadPOs();
  }, []);

  const selectedPurchaseOrder = purchaseOrders.find(
    (po) => po._id === selectedPO
  );

  const handlePOChange = (id) => {
    setSelectedPO(id);
    setResult(null);
    setError("");

    const po = purchaseOrders.find((item) => item._id === id);

    if (po) {
      setFulfilledQty(
        po.confirmedQuantity != null
          ? po.confirmedQuantity
          : 0
      );
    }
  };

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
              actionTaken: response.data.actionTaken,
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

  const runAgent = async () => {
    try {
      setRunning(true);
      setError("");
      setResult(null);

      const response = await api.post(
        "/agent/supplier-shortfall",
        {
          poId: selectedPO,
          fulfilledQty: Number(fulfilledQty),
        }
      );

      setResult(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.error ||
          "Failed to run supplier shortfall agent."
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="scenario-page">
      <div className="scenario-container">
        {/* Header */}

        <div className="scenario-header">
          <div className="scenario-header-top">
            <div>
              <div className="scenario-eyebrow">
                <Zap size={13} />
                Scenario 02 · Supplier Shortfall
              </div>

              <h1 className="scenario-title">
                Recover from supplier shortfalls.
              </h1>

              <p className="scenario-subtitle">
                When a supplier cannot fulfil the full purchase order,
                the agent evaluates inventory, alternate suppliers,
                budget and storage before deciding what to do next.
              </p>
            </div>

            <Link
              to="/"
              className="scenario-back-link"
            >
              <ArrowLeft size={15} />
              Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div
            className="scenario-error"
            style={{ marginBottom: "20px" }}
          >
            {error}
          </div>
        )}

        <div className="scenario-grid">
          {/* LEFT */}

          <div className="scenario-card">
            <div className="scenario-card-header">
              <h2>Shortfall trigger</h2>

              <p>
                Select an existing purchase order and report what
                the supplier actually confirmed.
              </p>
            </div>

            <div className="scenario-card-body">
              {loading ? (
                <div className="scenario-empty">
                  Loading purchase orders...
                </div>
              ) : (
                <div className="scenario-form">
                  <div className="scenario-field">
                    <label>Purchase order</label>

                    <select
                      value={selectedPO}
                      onChange={(e) =>
                        handlePOChange(e.target.value)
                      }
                    >
                      {purchaseOrders.map((po) => (
                        <option
                          key={po._id}
                          value={po._id}
                        >
                          {po._id.slice(-8)} ·{" "}
                          {po.status || "Open"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPurchaseOrder && (
                    <div className="scenario-product-preview">
                      <div className="scenario-product-name">
                        Purchase Order
                      </div>

                      <div className="scenario-product-sku">
                        ID: {selectedPurchaseOrder._id}
                      </div>

                      <div className="scenario-product-details">
                        <div className="scenario-product-detail">
                          <span>Ordered</span>

                          <strong>
                            {selectedPurchaseOrder.orderedQuantity ??
                              selectedPurchaseOrder.quantityOrdered ??
                              selectedPurchaseOrder.quantity ??
                              selectedPurchaseOrder.quantity_ordered ??
                              "—"}{" "}
                            units
                          </strong>
                        </div>

                        <div className="scenario-product-detail">
                          <span>Status</span>

                          <strong>
                            {selectedPurchaseOrder.status ||
                              "Open"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="scenario-field">
                    <label>
                      Quantity supplier can fulfil
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={fulfilledQty}
                      onChange={(e) =>
                        setFulfilledQty(e.target.value)
                      }
                      placeholder="Example: 250"
                    />
                  </div>

                  <button
                    className="scenario-run-button"
                    onClick={runAgent}
                    disabled={
                      running ||
                      !selectedPO ||
                      fulfilledQty === ""
                    }
                  >
                    {running ? (
                      <>
                        <Brain size={17} />
                        Agent is evaluating...
                      </>
                    ) : (
                      <>
                        <Zap size={17} />
                        Run Shortfall Agent
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}

          <div>
            <div className="scenario-card">
              <div className="scenario-card-header">
                <h2>Agent workflow</h2>

                <p>
                  The agent follows the same controlled autonomy
                  pipeline.
                </p>
              </div>

              <div className="scenario-card-body">
                <div className="scenario-pipeline">
                  <PipelineStep
                    icon={ClipboardList}
                    title="Investigate"
                    complete={Boolean(result)}
                  />

                  <PipelineStep
                    icon={Brain}
                    title="Decide"
                    active={running}
                    complete={Boolean(result)}
                  />

                  <PipelineStep
                    icon={Truck}
                    title="Act"
                    complete={Boolean(
                      result?.actionResult
                    )}
                  />

                  <PipelineStep
                    icon={ShieldCheck}
                    title="Validate"
                    complete={Boolean(
                      result?.validationResult
                    )}
                  />
                </div>

                {!result && !running && (
                  <div className="scenario-empty">
                    <Package
                      size={30}
                      style={{
                        marginBottom: "10px",
                        opacity: 0.5,
                      }}
                    />

                    <div>
                      Run the agent to analyse the supplier
                      shortfall.
                    </div>
                  </div>
                )}

                {running && (
                  <div className="scenario-empty">
                    <Brain
                      size={30}
                      style={{
                        marginBottom: "10px",
                        opacity: 0.6,
                      }}
                    />

                    <div>
                      Investigating supplier coverage and
                      recovery options...
                    </div>
                  </div>
                )}

                {result && (
                  <>
                    <div className="scenario-section-title">
                      <Brain size={16} />
                      Agent decision
                    </div>

                    <div className="scenario-decision-card">
                      <div className="scenario-decision-top">
                        <span className="scenario-decision-badge">
                          {result.decision?.decision ||
                            result.decision ||
                            "Decision"}
                        </span>

                        <div className="scenario-confidence">
                          Confidence:{" "}
                          <strong>
                            {result.decision?.confidence != null
                              ? `${Math.round(
                                  result.decision.confidence *
                                    100
                                )}%`
                              : "—"}
                          </strong>
                        </div>
                      </div>

                      {result.decision
                        ?.additional_quantity != null && (
                        <div className="scenario-decision-quantity">
                          {
                            result.decision
                              .additional_quantity
                          }{" "}
                          <span>
                            additional units
                          </span>
                        </div>
                      )}

                      {result.decision?.reasons?.length > 0 && (
                        <ul className="scenario-reasons">
                          {result.decision.reasons.map(
                            (reason, index) => (
                              <li key={index}>
                                <CheckCircle2
                                  size={15}
                                  style={{
                                    flexShrink: 0,
                                    marginTop: 2,
                                  }}
                                />
                                {reason}
                              </li>
                            )
                          )}
                        </ul>
                      )}
                    </div>

                    {result.actionResult && (
                      <>
                        {result.finalStatus === "awaiting_approval" ? (
                          <div className="scenario-approval-card">
                            <div className="scenario-approval-title">
                              <AlertTriangle size={17} />
                              Human approval required
                            </div>

                            <p>
                              The agent wants to take the following
                              purchasing action. Approval is required
                              before execution.
                            </p>

                            {result.actionResult.actionTaken && (
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
                                  Create PO for{" "}
                                  <strong>
                                    {
                                      result.actionResult.actionTaken
                                        .quantity
                                    }
                                  </strong>{" "}
                                  additional units.
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
                          </div>
                        ) : (
                          <div className="scenario-status-card">
                            <div className="scenario-status-row">
                              <span className="scenario-status-label">
                                Action status
                              </span>

                              <span className="scenario-status-value">
                                {result.finalStatus === "completed"
                                  ? "✓ Executed"
                                  : result.finalStatus === "rejected"
                                  ? "Rejected"
                                  : result.actionResult.status ||
                                    "Processed"}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {result.validationResult && (
                      <div className="scenario-status-card">
                        <div className="scenario-status-row">
                          <span className="scenario-status-label">
                            Validation
                          </span>

                          <span
                            className="scenario-status-value"
                            style={{
                              color:
                                result.finalStatus === "completed"
                                  ? "#15803d"
                                  : result.finalStatus === "rejected"
                                  ? "#b91c1c"
                                  : "#b45309",
                            }}
                          >
                            <span
                              className="scenario-status-dot"
                              style={{
                                background:
                                  result.finalStatus === "completed"
                                    ? "#22c55e"
                                    : result.finalStatus === "rejected"
                                    ? "#ef4444"
                                    : "#f59e0b",
                              }}
                            />

                            {result.finalStatus === "awaiting_approval"
                              ? "Pending approval"
                              : result.finalStatus === "completed"
                              ? "Validated"
                              : result.finalStatus === "rejected"
                              ? "Rejected"
                              : "Failed"}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}