import Card from "../common/Card";

function StatCard({ label, value, description, icon: Icon }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
        </div>

        {Icon && (
          <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700">
            <Icon size={20} />
          </div>
        )}
      </div>
    </Card>
  );
}

export default StatCard;