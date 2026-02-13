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
    <div className="bg-card border border-border rounded-lg p-3 md:p-4 space-y-3 md:space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 sm:flex sm:items-center sm:justify-between gap-3 sm:gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center min-w-0">
            <div className={`text-xl sm:text-2xl font-display font-bold ${stat.color} leading-none`}>{stat.value}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1 truncate">{stat.label}</div>
          </div>
        ))}
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
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
