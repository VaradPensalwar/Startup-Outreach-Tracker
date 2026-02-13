import { useState, useMemo, useCallback } from "react";
import { generateCompanies, Company, COMPANY_COUNT } from "@/data/companies";
import CompanyRow from "@/components/CompanyRow";
import StatsBar from "@/components/StatsBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, CheckSquare, Download } from "lucide-react";

const Index = () => {
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem("startup-tracker");
    return saved ? JSON.parse(saved) : generateCompanies();
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const save = useCallback((updated: Company[]) => {
    setCompanies(updated);
    localStorage.setItem("startup-tracker", JSON.stringify(updated));
  }, []);

  const toggleContacted = useCallback((id: number) => {
    save(companies.map(c => {
      if (c.id !== id) return c;
      const contacted = !c.contacted;
      return {
        ...c,
        contacted,
        status: contacted ? "contacted" : "not_contacted",
        lastContactDate: contacted ? new Date().toLocaleDateString() : null,
      };
    }));
  }, [companies, save]);

  const changeStatus = useCallback((id: number, status: Company["status"]) => {
    save(companies.map(c => c.id === id ? { ...c, status, contacted: status !== "not_contacted", lastContactDate: status !== "not_contacted" ? (c.lastContactDate || new Date().toLocaleDateString()) : null } : c));
  }, [companies, save]);

  const changePriority = useCallback((id: number, priority: Company["priority"]) => {
    save(companies.map(c => c.id === id ? { ...c, priority } : c));
  }, [companies, save]);

  const filtered = useMemo(() => {
    return companies.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (filterPriority !== "all" && c.priority !== filterPriority) return false;
      return true;
    });
  }, [companies, search, filterStatus, filterPriority]);

  const markAllFiltered = () => {
    const ids = new Set(filtered.filter(c => !c.contacted).map(c => c.id));
    if (ids.size === 0) return;
    save(companies.map(c => ids.has(c.id) ? { ...c, contacted: true, status: "contacted" as const, lastContactDate: new Date().toLocaleDateString() } : c));
  };

  const resetAll = () => {
    const fresh = generateCompanies();
    save(fresh);
  };

  const exportCSV = () => {
    const header = "Name,Status,Priority,Contacted,Last Contact\n";
    const rows = companies.map(c => `"${c.name}",${c.status},${c.priority},${c.contacted},${c.lastContactDate || ""}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "startup-outreach.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary shrink-0" />
          <div>
            <h1 className="text-lg font-display font-bold text-foreground tracking-tight">Startup Outreach Tracker</h1>
            <p className="text-xs text-muted-foreground">{COMPANY_COUNT} companies from PDF</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <StatsBar companies={companies} />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-card"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] h-9 text-sm bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_contacted">Not Contacted</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="meeting_scheduled">Meeting</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[130px] h-9 text-sm bg-card">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={markAllFiltered} className="h-9 gap-1.5 text-xs">
            <CheckSquare className="w-3.5 h-3.5" />
            Mark Filtered
          </Button>

          <Button variant="outline" size="sm" onClick={exportCSV} className="h-9 gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>

        {/* Company List */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-2 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span className="w-4" />
            <span>Company</span>
            <span>Priority</span>
            <span>Status</span>
            <span className="w-[80px]" />
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((company) => (
                <CompanyRow
                  key={company.id}
                  company={company}
                  onToggleContacted={toggleContacted}
                  onStatusChange={changeStatus}
                  onPriorityChange={changePriority}
                />
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No companies match your filters
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pb-8">
          <span>Showing {filtered.length} of {COMPANY_COUNT} companies</span>
          <Button variant="ghost" size="sm" onClick={resetAll} className="text-xs text-muted-foreground hover:text-destructive">
            Reset All Data
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Index;
