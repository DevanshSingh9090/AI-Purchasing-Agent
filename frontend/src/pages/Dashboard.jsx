import { useEffect, useState } from "react";
import { getDashboardData } from "../services/dashboardService";

import {
  Activity,
  ArrowUpRight,
  Brain,
  ChevronRight,
  ClipboardList,
  Database,
  Gauge,
  LayoutDashboard,
  Package,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";

import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-mark">
          <Sparkles size={17} />
        </div>

        <div>
          <div className="brand-name">ProcureAI</div>
          <div className="brand-subtitle">PURCHASING INTELLIGENCE</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-label">Overview</div>

          <Link to="/" className="sidebar-item active">
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Workflows</div>

          <Link to="/scenario/1" className="sidebar-item">
            <Package size={16} />
            <span>Purchase Review</span>
          </Link>

          <Link to="/scenario/2" className="sidebar-item">
            <ClipboardList size={16} />
            <span>Supplier Shortfall</span>
          </Link>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Monitor</div>

          <div className="sidebar-item disabled">
            <Database size={16} />
            <span>Decision Logs</span>
          </div>

          <div className="sidebar-item disabled">
            <Gauge size={16} />
            <span>Evaluations</span>
          </div>

          <div className="sidebar-item disabled">
            <Settings size={16} />
            <span>Configuration</span>
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <div className="system-card">
          <div className="system-card-top">
            <span className="status-dot" />
            <span>Agent system online</span>
          </div>

          <p>
            Decision engine ready for workflow execution.
          </p>
        </div>

        <div className="version">
          <span>PROCUREAI</span>
          <span>v1.0</span>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="topbar">
      <div>
        <div className="breadcrumb">
          PROCUREMENT <span>/</span> CONTROL CENTER
        </div>

        <div className="topbar-title">
          AI Purchasing Agent
        </div>
      </div>

      <div className="topbar-right">
        <div className="live-indicator">
          <span className="status-dot" />
          All systems operational
        </div>

        <div className="avatar">AI</div>
      </div>
    </header>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  trend,
}) {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-icon">
          <Icon size={17} />
        </div>

        {trend && (
          <span className="metric-trend">
            <ArrowUpRight size={13} />
            {trend}
          </span>
        )}
      </div>

      <div className="metric-label">
        {label}
      </div>

      <div className="metric-value">
        {value}
      </div>

      <div className="metric-detail">
        {detail}
      </div>
    </div>
  );
}

function WorkflowCard({
  number,
  icon: Icon,
  title,
  description,
  trigger,
  tags,
  href,
}) {
  return (
    <div className="workflow-card">
      <div className="workflow-top">
        <div className="workflow-number">
          0{number}
        </div>

        <div className="workflow-icon">
          <Icon size={18} />
        </div>

        <div className="workflow-status">
          <span className="status-dot" />
          Ready
        </div>
      </div>

      <div className="workflow-content">
        <div className="workflow-eyebrow">
          AGENT WORKFLOW
        </div>

        <h3>{title}</h3>

        <p>{description}</p>

        <div className="trigger-box">
          <div className="trigger-label">
            TRIGGER
          </div>

          <div className="trigger-text">
            {trigger}
          </div>
        </div>

        <div className="workflow-tags">
          {tags.map((tag) => (
            <span key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <Link
        to={href}
        className="workflow-action"
      >
        Start workflow
        <ChevronRight size={15} />
      </Link>
    </div>
  );
}

function AgentPipeline() {
  const steps = [
    {
      number: "01",
      icon: Search,
      title: "Investigate",
      description: "Gather evidence",
    },
    {
      number: "02",
      icon: Brain,
      title: "Decide",
      description: "Reason over facts",
    },
    {
      number: "03",
      icon: Zap,
      title: "Act",
      description: "Execute safely",
    },
    {
      number: "04",
      icon: ShieldCheck,
      title: "Validate",
      description: "Verify outcome",
    },
  ];

  return (
    <div className="pipeline-card">
      <div className="section-heading">
        <div>
          <div className="section-eyebrow">
            AGENT ARCHITECTURE
          </div>

          <h2>Decision pipeline</h2>
        </div>

        <div className="feedback-badge">
          <Activity size={13} />
          Feedback loop enabled
        </div>
      </div>

      <div className="pipeline">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              className="pipeline-step-wrapper"
              key={step.title}
            >
              <div className="pipeline-step">
                <div className="pipeline-number">
                  {step.number}
                </div>

                <div className="pipeline-icon">
                  <Icon size={18} />
                </div>

                <div className="pipeline-title">
                  {step.title}
                </div>

                <div className="pipeline-description">
                  {step.description}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="pipeline-line">
                  <ChevronRight size={14} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pipeline-footer">
        <ShieldCheck size={15} />

        <span>
          Failed validation can return the workflow to
          the decision stage with new evidence.
        </span>
      </div>
    </div>
  );
}

function RecentActivity() {
  return (
    <div className="activity-card">
      <div className="section-heading">
        <div>
          <div className="section-eyebrow">
            ACTIVITY
          </div>

          <h2>Recent decisions</h2>
        </div>

        <span className="view-all">
          View all
          <ChevronRight size={14} />
        </span>
      </div>

      <div className="activity-list">
        <div className="activity-row">
          <div className="activity-icon success">
            <ShieldCheck size={15} />
          </div>

          <div className="activity-main">
            <div className="activity-title">
              Purchase recommendation validated
            </div>

            <div className="activity-meta">
              Scenario 1 · Purchase review
            </div>
          </div>

          <span className="activity-status success-text">
            Validated
          </span>
        </div>

        <div className="activity-row">
          <div className="activity-icon warning">
            <Brain size={15} />
          </div>

          <div className="activity-main">
            <div className="activity-title">
              Supplier shortfall requires decision
            </div>

            <div className="activity-meta">
              Scenario 2 · 250 / 500 units
            </div>
          </div>

          <span className="activity-status warning-text">
            Pending
          </span>
        </div>

        <div className="activity-row">
          <div className="activity-icon neutral">
            <Search size={15} />
          </div>

          <div className="activity-main">
            <div className="activity-title">
              Evidence collection completed
            </div>

            <div className="activity-meta">
              Inventory · Demand · Budget · Storage
            </div>
          </div>

          <span className="activity-status">
            Complete
          </span>
        </div>
      </div>
    </div>
  );
}

function PrinciplesCard() {
  return (
    <div className="principles-card">
      <div className="section-eyebrow">
        SYSTEM PRINCIPLES
      </div>

      <h2>
        Designed for controlled autonomy
      </h2>

      <div className="principle-list">
        <div className="principle">
          <div className="principle-icon">
            <Database size={15} />
          </div>

          <div>
            <strong>Evidence first</strong>
            <span>
              Operational data is gathered before reasoning.
            </span>
          </div>
        </div>

        <div className="principle">
          <div className="principle-icon">
            <ShieldCheck size={15} />
          </div>

          <div>
            <strong>Guardrails</strong>
            <span>
              Actions are checked against constraints.
            </span>
          </div>
        </div>

        <div className="principle">
          <div className="principle-icon">
            <Brain size={15} />
          </div>

          <div>
            <strong>Explainable decisions</strong>
            <span>
              Decisions include reasons and evidence.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  
  const [dashboardData, setDashboardData] = useState({
    products: [],
    purchaseOrders: [],
    budget: null,
    storage: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const data = await getDashboardData();

        setDashboardData(data);
      } catch (err) {
        console.error("Dashboard loading error:", err);
        setError("Unable to load live procurement data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <TopBar />

        <div className="dashboard">
          {/* HERO */}
          <section className="hero">
            <div>
              <div className="hero-eyebrow">
                <span className="status-dot" />
                AI PROCUREMENT OPERATIONS
              </div>

              <h1>
                Procurement
                <br />
                <span>
                  intelligence, automated.
                </span>
              </h1>

              <p>
                Make purchasing decisions using real
                operational evidence, execute them safely,
                and continuously validate the outcome.
              </p>
            </div>

            <div className="hero-badge">
              <Brain size={17} />

              <div>
                <span>DECISION ENGINE</span>
                <strong>Ready</strong>
              </div>
            </div>
          </section>

          {/* METRICS */}
          <section className="metrics-grid">
            <MetricCard
              icon={Package}
              label="Products"
              value={loading ? "—" : dashboardData.products.length}
              detail="Available in inventory"
              trend="+2 today"
            />

            <MetricCard
              icon={ClipboardList}
              label="Open purchase orders"
              value={loading ? "—" : dashboardData.purchaseOrders.length}
              detail="Currently active"
            />

            <MetricCard
              icon={Wallet}
              label="Available budget"
              value={
                loading || !dashboardData.budget
                  ? "—"
                  : `$${(
                      (dashboardData.budget.totalBudget -
                        dashboardData.budget.spentSoFar) /
                      1000
                    ).toFixed(1)}K`
              }
              detail="Remaining purchasing capacity"
            />

            <MetricCard
              icon={Activity}
              label="Agent status"
              value="Ready"
              detail="Decision engine available"
            />
          </section>

          {/* WORKFLOWS */}
          <section className="workflows-section">
            <div className="section-heading">
              <div>
                <div className="section-eyebrow">
                  WORKFLOWS
                </div>

                <h2>
                  What would you like the agent to handle?
                </h2>
              </div>

              <span className="workflow-count">
                2 workflows available
              </span>
            </div>

            <div className="workflow-grid">
              <WorkflowCard
                number="1"
                icon={Package}
                title="Purchase recommendation"
                description="Review an AI-generated purchase recommendation against inventory, demand, supplier terms, budget and storage."
                trigger="System recommends purchasing 800 units."
                tags={[
                  "Inventory",
                  "Demand",
                  "Budget",
                  "Storage",
                ]}
                href="/scenario/1"
              />

              <WorkflowCard
                number="2"
                icon={ClipboardList}
                title="Supplier fulfillment shortfall"
                description="Determine the best response when a supplier cannot fulfill the original purchase order."
                trigger="Supplier can fulfill only 250 of 500 units."
                tags={[
                  "Existing PO",
                  "Supplier",
                  "Inventory",
                  "Re-source",
                ]}
                href="/scenario/2"
              />
            </div>
          </section>

          {/* PIPELINE */}
          <section className="pipeline-section">
            <AgentPipeline />
          </section>

          {/* BOTTOM */}
          <section className="bottom-grid">
            <RecentActivity />
            <PrinciplesCard />
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;