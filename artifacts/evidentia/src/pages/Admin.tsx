import { useState, useEffect } from "react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, Mail, FileText, Eye, ArrowLeft, Lock } from "lucide-react";
import { getSupabase } from "../lib/supabase";

const ADMIN_PASSWORD = "evidentia2026";

type DayCount = { date: string; views: number };
type Signup = { email: string; created_at: string };
type Submission = { name: string; email: string; course: string; college: string; created_at: string };

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className={`rounded-2xl border bg-white p-6 flex items-center gap-4 shadow-sm`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("ev_admin") === "1");
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);

  const [totalViews, setTotalViews] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [totalSignups, setTotalSignups] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [chartData, setChartData] = useState<DayCount[]>([]);
  const [recentSignups, setRecentSignups] = useState<Signup[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem("ev_admin", "1");
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  }

  useEffect(() => {
    if (!authed) return;
    setLoading(true);

    async function fetchAll() {
      try {
        const supabase = getSupabase();

        // Total page views
        const { count: viewCount } = await supabase
          .from("page_views")
          .select("*", { count: "exact", head: true });

        // Today's views
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { count: todayCount } = await supabase
          .from("page_views")
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayStart.toISOString());

        // Total signups
        const { count: signupCount } = await supabase
          .from("early_access")
          .select("*", { count: "exact", head: true });

        // Total submissions
        const { count: submissionCount } = await supabase
          .from("syllabus_submissions")
          .select("*", { count: "exact", head: true });

        // Last 7 days chart data
        const days: DayCount[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          d.setHours(0, 0, 0, 0);
          const end = new Date(d);
          end.setDate(end.getDate() + 1);
          const { count } = await supabase
            .from("page_views")
            .select("*", { count: "exact", head: true })
            .gte("created_at", d.toISOString())
            .lt("created_at", end.toISOString());
          days.push({
            date: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
            views: count ?? 0,
          });
        }

        // Recent signups
        const { data: signups } = await supabase
          .from("early_access")
          .select("email, created_at")
          .order("created_at", { ascending: false })
          .limit(10);

        // Recent submissions
        const { data: submissions } = await supabase
          .from("syllabus_submissions")
          .select("name, email, course, college, created_at")
          .order("created_at", { ascending: false })
          .limit(10);

        setTotalViews(viewCount ?? 0);
        setTodayViews(todayCount ?? 0);
        setTotalSignups(signupCount ?? 0);
        setTotalSubmissions(submissionCount ?? 0);
        setChartData(days);
        setRecentSignups(signups ?? []);
        setRecentSubmissions(submissions ?? []);
      } catch (e) {
        setFetchError("Could not load analytics. Check Supabase RLS policies.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [authed]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Evidentia" className="mx-auto object-contain mb-4" style={{ width: "160px" }} />
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Enter admin password</span>
            </div>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-700 mb-3"
              autoFocus
            />
            {pwError && <p className="text-xs text-red-500 mb-3">Incorrect password.</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-blue-800 text-white text-sm font-semibold hover:bg-blue-900 transition-colors"
            >
              Sign In
            </button>
          </form>
          <div className="text-center mt-4">
            <Link href="/" className="text-xs text-gray-400 hover:text-blue-700 transition-colors">
              ← Back to site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to site
            </Link>
            <span className="text-gray-300">|</span>
            <img src="/logo.png" alt="Evidentia" className="object-contain" style={{ width: "120px" }} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Admin Dashboard</span>
            <button
              onClick={() => { sessionStorage.removeItem("ev_admin"); setAuthed(false); }}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
            <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            Loading analytics…
          </div>
        )}

        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {fetchError}
          </div>
        )}

        {!loading && !fetchError && (
          <>
            {/* Stat cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<Eye className="w-5 h-5 text-blue-700" />} label="Total Page Views" value={totalViews} color="bg-blue-50" />
              <StatCard icon={<Eye className="w-5 h-5 text-cyan-600" />} label="Views Today" value={todayViews} color="bg-cyan-50" />
              <StatCard icon={<Mail className="w-5 h-5 text-purple-600" />} label="Email Signups" value={totalSignups} color="bg-purple-50" />
              <StatCard icon={<FileText className="w-5 h-5 text-emerald-600" />} label="Syllabus Submitted" value={totalSubmissions} color="bg-emerald-50" />
            </div>

            {/* Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-6">Page Views — Last 7 Days</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                    cursor={{ fill: "#f3f4f6" }}
                  />
                  <Bar dataKey="views" fill="#1e40af" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tables */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Email signups */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-semibold text-gray-700">Recent Email Signups</h3>
                  <span className="ml-auto text-xs text-gray-400">{totalSignups} total</span>
                </div>
                {recentSignups.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No signups yet.</p>
                ) : (
                  <div className="space-y-2">
                    {recentSignups.map((s, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-800 truncate max-w-[200px]">{s.email}</span>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Syllabus submissions */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-gray-700">Recent Syllabus Submissions</h3>
                  <span className="ml-auto text-xs text-gray-400">{totalSubmissions} total</span>
                </div>
                {recentSubmissions.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No submissions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {recentSubmissions.map((s, i) => (
                      <div key={i} className="py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">{s.name}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{s.course} · {s.college}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
