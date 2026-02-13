import { Company } from "@/data/companies";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CompanyRowProps {
  company: Company;
  onToggleContacted: (id: number) => void;
  onStatusChange: (id: number, status: Company["status"]) => void;
  onPriorityChange: (id: number, priority: Company["priority"]) => void;
}

const statusConfig = {
  not_contacted: { label: "Not Contacted", className: "bg-muted text-muted-foreground" },
  contacted: { label: "Contacted", className: "bg-primary/15 text-primary" },
  replied: { label: "Replied", className: "bg-success/15 text-success" },
  meeting_scheduled: { label: "Meeting", className: "bg-warning/15 text-warning" },
};

const priorityConfig = {
  high: { label: "High", className: "bg-destructive/15 text-destructive" },
  medium: { label: "Med", className: "bg-warning/15 text-warning" },
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
};

const CompanyRow = ({ company, onToggleContacted, onStatusChange, onPriorityChange }: CompanyRowProps) => {
  const status = statusConfig[company.status];
  const priority = priorityConfig[company.priority];

  return (
    <div className={`group grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-3 border-b border-border transition-colors hover:bg-muted/50 ${company.contacted ? "opacity-60" : ""}`}>
      <Checkbox
        checked={company.contacted}
        onCheckedChange={() => onToggleContacted(company.id)}
        className="data-[state=checked]:bg-success data-[state=checked]:border-success"
      />

      <div className="min-w-0">
        <span className={`font-body text-sm font-medium truncate block ${company.contacted ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {company.name}
        </span>
        {company.lastContactDate && (
          <span className="text-xs text-muted-foreground">
            Last: {company.lastContactDate}
          </span>
        )}
      </div>

      <Select value={company.priority} onValueChange={(v) => onPriorityChange(company.id, v as Company["priority"])}>
        <SelectTrigger className="h-7 w-[80px] text-xs border-0 bg-transparent">
          <Badge variant="outline" className={`${priority.className} border-0 text-xs font-medium px-2 py-0.5`}>
            {priority.label}
          </Badge>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select value={company.status} onValueChange={(v) => onStatusChange(company.id, v as Company["status"])}>
        <SelectTrigger className="h-7 w-[130px] text-xs border-0 bg-transparent">
          <Badge variant="outline" className={`${status.className} border-0 text-xs font-medium px-2 py-0.5`}>
            {status.label}
          </Badge>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="not_contacted">Not Contacted</SelectItem>
          <SelectItem value="contacted">Contacted</SelectItem>
          <SelectItem value="replied">Replied</SelectItem>
          <SelectItem value="meeting_scheduled">Meeting Scheduled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CompanyRow;
