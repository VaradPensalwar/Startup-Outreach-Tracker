import { Company } from "@/data/companies";

interface StatsBarProps {
  companies: Company[];
}

const StatsBar = ({ companies }: StatsBarProps) => {
  const total = companies.length;
  const contacted = companies.filter(c => c.contacted).length;
  const replied = companies.filter(c => c.status === "replied").length;
  const meetings = companies.filter(c => c.status === "meeting_scheduled").length;
  const highPriority = companies.filter(c => c.priority === "high" && !c.contacted).length;

  const stats = [
    { label: "Total", value: total, color: "text-foreground" },
    { label: "Contacted", value: contacted, color: "text-primary" },
    { label: "Replied", value: replied, color: "text-success" },
    { label: "Meetings", value: meetings, color: "text-warning" },
    { label: "High Priority", value: highPriority, color: "text-destructive" },
  ];

  const progress = total > 0 ? (contacted / total) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between gap-6 flex-wrap">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center min-w-[80px]">
            <div className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Outreach Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
