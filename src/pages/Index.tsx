import { useState, useMemo, useCallback, useEffect } from "react";
import { generateCompanies, Company, COMPANY_COUNT } from "@/data/companies";
import { companyApi } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import CompanyRow from "@/components/CompanyRow";
import StatsBar from "@/components/StatsBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, FileText, CheckSquare, Download, LogOut } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const { user, loading: authLoading, configured, signIn, signOut } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  useEffect(() => {
    if (!user) {
      setCompanies([]);
      setLoadingCompanies(false);
      return;
    }

    let cancelled = false;
    const loadTracker = async () => {
      setLoadingCompanies(true);
      try {
        const remote = await companyApi.list();
        if (cancelled) return;

        if (remote.companies.length) {
          setCompanies(remote.companies);
          return;
        }

        // Preserve data created by the pre-MongoDB version once, then stop using Local Storage.
        let legacyCompanies: Company[] | null = null;
        try {
          const saved = localStorage.getItem("startup-tracker");
          const parsed = saved ? JSON.parse(saved) : null;
          if (Array.isArray(parsed) && parsed.length > 0)
            legacyCompanies = parsed;
        } catch {
          // A malformed legacy value should not prevent a new remote tracker from starting.
        }

        const initialCompanies = legacyCompanies || generateCompanies();
        const seeded = await companyApi.bootstrap(initialCompanies);
        if (cancelled) return;
        setCompanies(seeded.companies);
        if (legacyCompanies) localStorage.removeItem("startup-tracker");
      } catch (error) {
        if (!cancelled)
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not load your tracker.",
          );
      } finally {
        if (!cancelled) setLoadingCompanies(false);
      }
    };

    void loadTracker();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const today = () => new Date().toLocaleDateString();

  const updateCompany = useCallback(
    async (id: number, updates: Partial<Company>) => {
      const result = await companyApi.update(id, updates);
      setCompanies((current) =>
        current.map((company) =>
          company.id === id ? result.company : company,
        ),
      );
    },
    [],
  );

  const toggleContacted = useCallback(
    async (id: number) => {
      const company = companies.find((item) => item.id === id);
      if (!company) return;
      const contacted = !company.contacted;
      try {
        await updateCompany(id, {
          contacted,
          status: contacted ? "contacted" : "not_contacted",
          lastContactDate: contacted ? today() : null,
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not save this change.",
        );
      }
    },
    [companies, updateCompany],
  );

  const changeStatus = useCallback(
    async (id: number, status: Company["status"]) => {
      const company = companies.find((item) => item.id === id);
      if (!company) return;
      try {
        await updateCompany(id, {
          status,
          contacted: status !== "not_contacted",
          lastContactDate:
            status !== "not_contacted"
              ? company.lastContactDate || today()
              : null,
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not save this change.",
        );
      }
    },
    [companies, updateCompany],
  );

  const changePriority = useCallback(
    async (id: number, priority: Company["priority"]) => {
      try {
        await updateCompany(id, { priority });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not save this change.",
        );
      }
    },
    [updateCompany],
  );

  const ITEMS_PER_PAGE = 25;

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (filterPriority !== "all" && c.priority !== filterPriority)
        return false;
      return true;
    });
  }, [companies, search, filterStatus, filterPriority]);

  const pages = useMemo(() => {
    const result: Company[][] = [];
    for (let i = 0; i < filtered.length; i += ITEMS_PER_PAGE) {
      result.push(filtered.slice(i, i + ITEMS_PER_PAGE));
    }
    return result.length > 0 ? result : [[]];
  }, [filtered]);

  const markAllFiltered = async () => {
    const ids = new Set(filtered.filter((c) => !c.contacted).map((c) => c.id));
    if (ids.size === 0) return;
    const lastContactDate = today();
    try {
      await companyApi.markContacted([...ids], lastContactDate);
      setCompanies((current) =>
        current.map((company) =>
          ids.has(company.id)
            ? {
                ...company,
                contacted: true,
                status: "contacted" as const,
                lastContactDate,
              }
            : company,
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save the selected companies.",
      );
    }
  };

  const resetAll = async () => {
    try {
      const result = await companyApi.reset(generateCompanies());
      setCompanies(result.companies);
      toast.success("Your remote tracker has been reset.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not reset your tracker.",
      );
    }
  };

  const exportCSV = () => {
    const header = "Name,Status,Priority,Contacted,Last Contact\n";
    const rows = companies
      .map(
        (c) =>
          `"${c.name}",${c.status},${c.priority},${c.contacted},${c.lastContactDate || ""}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "startup-outreach.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/80 text-sm text-muted-foreground">
        Checking your sign-in…
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/80 p-4">
        <div className="max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
          <h1 className="font-display text-xl font-bold">
            Authentication setup required
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add the Firebase web app values from <code>.env.example</code>, then
            restart the app.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 hover:scale-[1.01]">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">
            Startup Outreach Tracker
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            Sign in with Google to securely access your personal outreach
            tracker and sync your data with MongoDB.
          </p>

          <Button
            className="mt-8 h-12 w-full rounded-xl bg-white font-semibold text-slate-900 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-slate-100 active:scale-[0.98]"
            onClick={() =>
              void signIn().catch((error) =>
                toast.error(error.message || "Google sign-in failed."),
              )
            }
          >
            Continue with Google
          </Button>
        </div>
      </div>
    );
  }

  if (loadingCompanies) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/80 text-sm text-muted-foreground">
        Loading your remote tracker…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/80 py-4 md:py-8 px-2 sm:px-4 print:bg-white print:py-0 space-y-4 md:space-y-8 print:space-y-0">
      <div className="mx-auto flex max-w-[210mm] items-center justify-between px-1 print:hidden">
        <div className="flex items-center gap-2 min-w-0">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt=""
              className="h-7 w-7 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => void signOut()}
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </Button>
      </div>
      {pages.map((pageCompanies, pageIndex) => (
        <div
          key={pageIndex}
          className="mx-auto bg-card shadow-[0_2px_20px_rgba(0,0,0,0.08)] border border-border print:shadow-none print:border-0 print:break-after-page max-w-full md:max-w-[210mm] p-4 sm:p-6 md:p-8 lg:p-12 print:p-[20mm_25mm]"
        >
          {/* PDF Header */}
          <div className="flex items-start justify-between border-b-2 border-foreground pb-3 md:pb-4 mb-4 md:mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-foreground tracking-tight leading-none break-words">
                STARTUP OUTREACH TRACKER
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-display">
                {COMPANY_COUNT} companies
              </p>
            </div>
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground shrink-0 ml-2" />
          </div>

          {/* Stats & Filters only on first page */}
          {pageIndex === 0 && (
            <>
              <StatsBar companies={companies} />

              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 mt-4 md:mt-6 mb-3 md:mb-4 print:hidden">
                <div className="relative flex-1 sm:min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm bg-background w-full"
                  />
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="flex-1 sm:w-[150px] h-9 text-xs sm:text-sm bg-background">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="not_contacted">
                        Not Contacted
                      </SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="meeting_scheduled">Meeting</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterPriority}
                    onValueChange={setFilterPriority}
                  >
                    <SelectTrigger className="flex-1 sm:w-[130px] h-9 text-xs sm:text-sm bg-background">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllFiltered}
                    className="flex-1 sm:flex-none h-9 gap-1.5 text-xs"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark Filtered</span>
                    <span className="sm:hidden">Mark All</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportCSV}
                    className="flex-1 sm:flex-none h-9 gap-1.5 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">Export</span>
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Company List */}
          <div className="border border-border rounded overflow-hidden">
            <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 md:gap-4 px-3 md:px-4 py-2 bg-muted/50 border-b border-border text-xs font-display font-medium text-muted-foreground uppercase tracking-wider">
              <span className="w-4" />
              <span>Company</span>
              <span>Priority</span>
              <span>Status</span>
            </div>
            {pageCompanies.length > 0 ? (
              pageCompanies.map((company) => (
                <CompanyRow
                  key={company.id}
                  company={company}
                  onToggleContacted={toggleContacted}
                  onStatusChange={changeStatus}
                  onPriorityChange={changePriority}
                />
              ))
            ) : (
              <div className="py-8 md:py-12 text-center text-muted-foreground text-xs sm:text-sm">
                No companies match your filters
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 text-xs text-muted-foreground mt-4 md:mt-6 pt-3 md:pt-4 border-t border-border">
            <span>
              Showing {filtered.length} of {COMPANY_COUNT} companies
            </span>
            {pageIndex === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAll}
                className="text-xs text-muted-foreground hover:text-destructive print:hidden"
              >
                Reset All Data
              </Button>
            )}
          </div>

          {/* Page number */}
          <div className="text-center text-xs text-muted-foreground mt-6 md:mt-8 font-display">
            — Page {pageIndex + 1} of {pages.length} —
          </div>
        </div>
      ))}
    </div>
  );
};

export default Index;
