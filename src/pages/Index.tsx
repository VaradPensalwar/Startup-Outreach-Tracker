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
      <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden font-sans">
        {/* Ambient background glow for premium depth */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-200/40 dark:bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative max-w-md w-full rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-xl p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:bg-slate-900/80 dark:border-slate-800 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          {/* App Logo / Icon */}
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-white dark:text-slate-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>

          {/* Typography */}
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Startup Outreach Tracker
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Sign in with Google to securely load your personal tracker from
            MongoDB.
          </p>

          {/* Button with Google SVG */}
          <Button
            variant="outline"
            className="mt-8 w-full bg-white text-slate-800 border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 transition-all duration-300 font-medium py-2.5 shadow-sm rounded-xl flex items-center justify-center gap-3 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700"
            onClick={() =>
              void signIn().catch((error) =>
                toast.error(error.message || "Google sign-in failed."),
              )
            }
          >
            {/* Standard Google "G" Logo SVG */}
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Industry Standard: Trust Footer */}
          <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
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
