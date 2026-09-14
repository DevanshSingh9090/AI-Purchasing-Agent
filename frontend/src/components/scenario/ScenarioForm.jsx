import Card from "../common/Card";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";

function ScenarioForm({
  title,
  description,
  children,
  onSubmit,
  loading = false,
  submitLabel = "Run Analysis",
}) {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {children}

        <div className="pt-2">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="small" />
                Running agent...
              </span>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default ScenarioForm;