import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  Users,
  Mail,
  FileText,
  Eye,
  ArrowLeft,
  Upload,
  Trash2,
  BookOpen,
  X,
  AlertCircle,
  CheckCircle,
  Plus,
  MessageSquareQuote,
  Star,
  Loader2,
  Pencil,
  BarChart3
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

type DayCount = { date: string; views: number };
type Signup = { email: string; created_at: string };
type Submission = { name: string; email: string; course: string; college: string; created_at: string };
type Note = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  note_type: string | null;
  course: string | null;
  file_url: string;
  file_name: string | null;
  tags: string[] | null;
  is_free: boolean;
  price: number | null;
  created_at: string;
};
type Testimonial = {
  id: string;
  user_id: string;
  display_name: string;
  rating: number;
  content: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};
type NoteAnalyticsData = {
  views: number;
  downloads: number;
  uniqueViewers: number;
  uniqueDownloaders: number;
  todayViews: number;
  todayDownloads: number;
  periodViews: number;
  periodDownloads: number;
};

type NoteChartData = {
  date: string;
  views: number;
  downloads: number;
};

const SUBJECTS = [
  "Forensic Chemistry", "Forensic Toxicology", "Forensic Biology",
  "DNA Analysis", "Forensic Physics", "Crime Scene Investigation",
  "Forensic Anthropology", "Document Examination", "Ballistics",
  "Forensic Psychology", "Other",
];
const ALLOWED_TYPES = ["application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ALLOWED_EXT = [".pdf", ".doc", ".docx"];
const MAX_MB = 50;

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [period, setPeriod] = useState<"7" | "30" | "90" | "all">("7");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [totalViews, setTotalViews] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [newUsersToday, setNewUsersToday] = useState(0);

  const [totalNotes, setTotalNotes] = useState(0);
  const [freeNotes, setFreeNotes] = useState(0);
  const [paidNotes, setPaidNotes] = useState(0);

  const [totalRevenue, setTotalRevenue] = useState(0);

  const [viewsData, setViewsData] = useState<DayCount[]>([]);
  const [usersData, setUsersData] = useState<
    { date: string; users: number }[]
  >([]);

  const [revenueData, setRevenueData] = useState<
    { date: string; revenue: number }[]
  >([]);

  const [mostViewed, setMostViewed] = useState<
    { title: string; views: number }[]
  >([]);

  const [mostDownloaded, setMostDownloaded] = useState<
    { title: string; downloads: number }[]
  >([]);

  const [recentUsers, setRecentUsers] = useState<
    {
      id: string;
      display_name: string | null;
      email: string | null;
      created_at: string;
      status: string;
    }[]
  >([]);

  const [recentPurchases, setRecentPurchases] = useState<
    {
      id: string;
      amount: number;
      created_at: string;
      user: string;
      note: string;
      status: string;
    }[]
  >([]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    setError("");

    try {
      const supabase = getSupabase();

      const now = new Date();

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      let periodStart: Date | null = null;

      if (period !== "all") {
        periodStart = new Date(now);
        periodStart.setDate(
          periodStart.getDate() - Number(period) + 1
        );
        periodStart.setHours(0, 0, 0, 0);
      }

      // =====================================================
      // OVERVIEW
      // =====================================================

      const { count: viewsCount } = await supabase
        .from("page_views")
        .select("*", {
          count: "exact",
          head: true
        });

      const { count: todayViewCount } = await supabase
        .from("page_views")
        .select("*", {
          count: "exact",
          head: true
        })
        .gte("created_at", todayStart.toISOString());

      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", {
          count: "exact",
          head: true
        });

      const { count: todayUsersCount } = await supabase
        .from("profiles")
        .select("*", {
          count: "exact",
          head: true
        })
        .gte("created_at", todayStart.toISOString());

      const { count: notesCount } = await supabase
        .from("notes")
        .select("*", {
          count: "exact",
          head: true
        });

      const { count: freeNotesCount } = await supabase
        .from("notes")
        .select("*", {
          count: "exact",
          head: true
        })
        .eq("is_free", true);

      const { count: paidNotesCount } = await supabase
        .from("notes")
        .select("*", {
          count: "exact",
          head: true
        })
        .eq("is_free", false);

      const { data: revenueRows } = await supabase
        .from("purchases")
        .select("amount")
        .eq("status", "completed");

      const revenue =
        revenueRows?.reduce(
          (sum, purchase) =>
            sum + Number(purchase.amount || 0),
          0
        ) ?? 0;

      setTotalViews(viewsCount ?? 0);
      setTodayViews(todayViewCount ?? 0);
      setTotalUsers(usersCount ?? 0);
      setNewUsersToday(todayUsersCount ?? 0);

      setTotalNotes(notesCount ?? 0);
      setFreeNotes(freeNotesCount ?? 0);
      setPaidNotes(paidNotesCount ?? 0);
      setTotalRevenue(revenue);

      // =====================================================
      // PAGE VIEWS CHART
      // =====================================================

      const days: DayCount[] = [];

      const numberOfDays =
        period === "all"
          ? 30
          : Number(period);

      for (let i = numberOfDays - 1; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(start.getDate() - i);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const { count } = await supabase
          .from("page_views")
          .select("*", {
            count: "exact",
            head: true
          })
          .gte("created_at", start.toISOString())
          .lt("created_at", end.toISOString());

        days.push({
          date: start.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short"
          }),
          views: count ?? 0
        });
      }

      setViewsData(days);

      // =====================================================
      // USERS CHART
      // =====================================================

      const usersChart: {
        date: string;
        users: number;
      }[] = [];

      for (let i = numberOfDays - 1; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(start.getDate() - i);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const { count } = await supabase
          .from("profiles")
          .select("*", {
            count: "exact",
            head: true
          })
          .gte("created_at", start.toISOString())
          .lt("created_at", end.toISOString());

        usersChart.push({
          date: start.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short"
          }),
          users: count ?? 0
        });
      }

      setUsersData(usersChart);

      // =====================================================
      // REVENUE CHART
      // =====================================================

      const revenueChart: {
        date: string;
        revenue: number;
      }[] = [];

      for (let i = numberOfDays - 1; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(start.getDate() - i);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const { data } = await supabase
          .from("purchases")
          .select("amount")
          .eq("status", "completed")
          .gte("created_at", start.toISOString())
          .lt("created_at", end.toISOString());

        const dayRevenue =
          data?.reduce(
            (sum, purchase) =>
              sum + Number(purchase.amount || 0),
            0
          ) ?? 0;

        revenueChart.push({
          date: start.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short"
          }),
          revenue: dayRevenue
        });
      }

      setRevenueData(revenueChart);

      // =====================================================
      // MOST VIEWED NOTES
      // =====================================================

      const { data: viewedRows } = await supabase
        .from("note_views")
        .select(`
          note_id,
          notes (
            title
          )
        `);

      const viewMap = new Map<string, number>();

      viewedRows?.forEach((row: any) => {
        const title = row.notes?.title;

        if (!title) return;

        viewMap.set(
          title,
          (viewMap.get(title) ?? 0) + 1
        );
      });

      setMostViewed(
        [...viewMap.entries()]
          .map(([title, views]) => ({
            title,
            views
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 10)
      );

      // =====================================================
      // MOST DOWNLOADED NOTES
      // =====================================================

      const { data: downloadRows } = await supabase
        .from("note_downloads")
        .select(`
          note_id,
          notes (
            title
          )
        `);

      const downloadMap = new Map<string, number>();

      downloadRows?.forEach((row: any) => {
        const title = row.notes?.title;

        if (!title) return;

        downloadMap.set(
          title,
          (downloadMap.get(title) ?? 0) + 1
        );
      });

      setMostDownloaded(
        [...downloadMap.entries()]
          .map(([title, downloads]) => ({
            title,
            downloads
          }))
          .sort(
            (a, b) => b.downloads - a.downloads
          )
          .slice(0, 10)
      );

      // =====================================================
      // RECENT USERS
      // =====================================================

      const { data: users } = await supabase
        .from("profiles")
        .select(
          "id, display_name, email, created_at, status"
        )
        .order("created_at", {
          ascending: false
        })
        .limit(10);

      setRecentUsers(users ?? []);

      // =====================================================
      // RECENT PURCHASES
      // =====================================================

      const { data: purchases } = await supabase
        .from("purchases")
        .select(`
          id,
          amount,
          created_at,
          status,
          profiles (
            display_name,
            email
          ),
          notes (
            title
          )
        `)
        .order("created_at", {
          ascending: false
        })
        .limit(10);

      setRecentPurchases(
        (purchases ?? []).map((purchase: any) => ({
          id: purchase.id,
          amount: Number(purchase.amount || 0),
          created_at: purchase.created_at,
          user:
            purchase.profiles?.display_name ||
            purchase.profiles?.email ||
            "Unknown user",
          note:
            purchase.notes?.title ||
            "Deleted note",
          status: purchase.status
        }))
      );

    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

        <div>
          <h2 className="text-base font-bold text-gray-900">
            Analytics
          </h2>

          <p className="text-xs text-gray-400 mt-0.5">
            Overview of Evidentia activity
          </p>
        </div>

        <select
          value={period}
          onChange={e =>
            setPeriod(
              e.target.value as
                | "7"
                | "30"
                | "90"
                | "all"
            )
          }
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="7">
            Last 7 days
          </option>

          <option value="30">
            Last 30 days
          </option>

          <option value="90">
            Last 90 days
          </option>

          <option value="all">
            All time
          </option>
        </select>

      </div>


      {/* OVERVIEW */}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        <StatCard
          icon={<Eye className="w-5 h-5 text-blue-700" />}
          label="Total Page Views"
          value={totalViews}
          color="bg-blue-50"
        />

        <StatCard
          icon={<Eye className="w-5 h-5 text-cyan-600" />}
          label="Views Today"
          value={todayViews}
          color="bg-cyan-50"
        />

        <StatCard
          icon={<Users className="w-5 h-5 text-purple-600" />}
          label="Total Users"
          value={totalUsers}
          color="bg-purple-50"
        />

        <StatCard
          icon={<Users className="w-5 h-5 text-indigo-600" />}
          label="New Users Today"
          value={newUsersToday}
          color="bg-indigo-50"
        />

        <StatCard
          icon={<BookOpen className="w-5 h-5 text-blue-600" />}
          label="Total Notes"
          value={totalNotes}
          color="bg-blue-50"
        />

        <StatCard
          icon={<FileText className="w-5 h-5 text-emerald-600" />}
          label="Free Notes"
          value={freeNotes}
          color="bg-emerald-50"
        />

        <StatCard
          icon={<FileText className="w-5 h-5 text-orange-600" />}
          label="Paid Notes"
          value={paidNotes}
          color="bg-orange-50"
        />

        <StatCard
          icon={<span className="text-lg font-bold text-green-700">₹</span>}
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          color="bg-green-50"
        />

      </div>


      {/* PAGE VIEWS */}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">

        <h3 className="text-sm font-semibold text-gray-700 mb-6">
          Page Views
        </h3>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={viewsData}>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{
                fontSize: 11,
                fill: "#9ca3af"
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              allowDecimals={false}
              tick={{
                fontSize: 11,
                fill: "#9ca3af"
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip />

            <Bar
              dataKey="views"
              fill="#1e40af"
              radius={[5, 5, 0, 0]}
            />

          </BarChart>
        </ResponsiveContainer>

      </div>


      {/* USERS + REVENUE */}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <h3 className="text-sm font-semibold text-gray-700 mb-6">
            New Users
          </h3>

          <ResponsiveContainer width="100%" height={220}>

            <BarChart data={usersData}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 11,
                  fill: "#9ca3af"
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 11,
                  fill: "#9ca3af"
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip />

              <Bar
                dataKey="users"
                fill="#7c3aed"
                radius={[5, 5, 0, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>


        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <h3 className="text-sm font-semibold text-gray-700 mb-6">
            Revenue
          </h3>

          <ResponsiveContainer width="100%" height={220}>

            <BarChart data={revenueData}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 11,
                  fill: "#9ca3af"
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "#9ca3af"
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(value: number) =>
                  `₹${value}`
                }
              />

              <Bar
                dataKey="revenue"
                fill="#059669"
                radius={[5, 5, 0, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>


      {/* FREE VS PAID */}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">

        <h3 className="text-sm font-semibold text-gray-700 mb-5">
          Notes Distribution
        </h3>

        <div className="grid grid-cols-2 gap-4">

          <div className="rounded-xl bg-emerald-50 p-5">

            <p className="text-xs text-emerald-600">
              Free Notes
            </p>

            <p className="text-2xl font-bold text-emerald-800 mt-1">
              {freeNotes}
            </p>

          </div>

          <div className="rounded-xl bg-orange-50 p-5">

            <p className="text-xs text-orange-600">
              Paid Notes
            </p>

            <p className="text-2xl font-bold text-orange-800 mt-1">
              {paidNotes}
            </p>

          </div>

        </div>

      </div>


      {/* NOTE PERFORMANCE */}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Most Viewed Notes
          </h3>

          {mostViewed.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">
              No note views yet.
            </p>
          ) : (
            <div className="space-y-2">

              {mostViewed.map((note, index) => (

                <div
                  key={`${note.title}-${index}`}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                >

                  <div className="flex items-center gap-3 min-w-0">

                    <span className="text-xs text-gray-400 w-5">
                      {index + 1}
                    </span>

                    <span className="text-sm text-gray-800 truncate">
                      {note.title}
                    </span>

                  </div>

                  <span className="text-xs font-semibold text-blue-700">
                    {note.views}
                  </span>

                </div>

              ))}

            </div>
          )}

        </div>


        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Most Downloaded Notes
          </h3>

          {mostDownloaded.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">
              No downloads yet.
            </p>
          ) : (
            <div className="space-y-2">

              {mostDownloaded.map((note, index) => (

                <div
                  key={`${note.title}-${index}`}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                >

                  <div className="flex items-center gap-3 min-w-0">

                    <span className="text-xs text-gray-400 w-5">
                      {index + 1}
                    </span>

                    <span className="text-sm text-gray-800 truncate">
                      {note.title}
                    </span>

                  </div>

                  <span className="text-xs font-semibold text-blue-700">
                    {note.downloads}
                  </span>

                </div>

              ))}

            </div>
          )}

        </div>

      </div>


      {/* RECENT USERS + PURCHASES */}

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <div className="flex items-center gap-2 mb-4">

            <Users className="w-4 h-4 text-purple-600" />

            <h3 className="text-sm font-semibold text-gray-700">
              Recent Users
            </h3>

          </div>

          <div className="space-y-3">

            {recentUsers.map(user => (

              <div
                key={user.id}
                className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0"
              >

                <div className="min-w-0">

                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user.display_name || "User"}
                  </p>

                  <p className="text-xs text-gray-400 truncate">
                    {user.email}
                  </p>

                </div>

                <span className="text-xs text-gray-400 ml-3 whitespace-nowrap">
                  {new Date(
                    user.created_at
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short"
                  })}
                </span>

              </div>

            ))}

          </div>

        </div>


        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          <div className="flex items-center gap-2 mb-4">

            <FileText className="w-4 h-4 text-green-600" />

            <h3 className="text-sm font-semibold text-gray-700">
              Recent Purchases
            </h3>

          </div>

          <div className="space-y-3">

            {recentPurchases.map(purchase => (

              <div
                key={purchase.id}
                className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0"
              >

                <div className="min-w-0">

                  <p className="text-sm font-medium text-gray-800 truncate">
                    {purchase.user}
                  </p>

                  <p className="text-xs text-gray-400 truncate">
                    {purchase.note}
                  </p>

                </div>

                <span className="text-sm font-semibold text-green-700 ml-3 whitespace-nowrap">
                  ₹{purchase.amount}
                </span>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "suspended"
  >("all");

  const [sort, setSort] = useState<
    "newest" | "oldest"
  >("newest");

  const [selectedUser, setSelectedUser] =
    useState<any | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError("");

    try {
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          display_name,
          email,
          created_at,
          status,
          purchases (
            id,
            amount,
            status,
            created_at,
            notes (
              title
            )
          )
        `)
        .order("created_at", {
          ascending: false
        });

      if (error) throw error;

      setUsers(data ?? []);

    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load users."
      );
    } finally {
      setLoading(false);
    }
  }

  const processedUsers = users
    .map(user => {

      const purchases =
        user.purchases?.filter(
          (p: any) =>
            p.status === "completed"
        ) ?? [];

      const spent = purchases.reduce(
        (sum: number, purchase: any) =>
          sum + Number(purchase.amount || 0),
        0
      );

      return {
        ...user,
        purchaseCount: purchases.length,
        spent
      };
    })
    .filter(user => {

      const searchValue =
        search.trim().toLowerCase();

      if (searchValue) {

        const name =
          user.display_name
            ?.toLowerCase() ?? "";

        const email =
          user.email
            ?.toLowerCase() ?? "";

        if (
          !name.includes(searchValue) &&
          !email.includes(searchValue)
        ) {
          return false;
        }
      }

      if (
        statusFilter !== "all" &&
        user.status !== statusFilter
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {

      const aTime =
        new Date(a.created_at).getTime();

      const bTime =
        new Date(b.created_at).getTime();

      return sort === "newest"
        ? bTime - aTime
        : aTime - bTime;
    });

  const totalUsers = users.length;

  const newToday = users.filter(user => {

    const today = new Date();

    const created =
      new Date(user.created_at);

    return (
      created.getFullYear() ===
        today.getFullYear() &&
      created.getMonth() ===
        today.getMonth() &&
      created.getDate() ===
        today.getDate()
    );

  }).length;

  const buyers = users.filter(user =>
    (user.purchases ?? []).some(
      (p: any) =>
        p.status === "completed"
    )
  ).length;

  function openUser(user: any) {
    setSelectedUser(user);
  }

  return (
    <div>

      {/* HEADER */}

      <div className="flex items-center justify-between mb-6">

        <div>

          <h2 className="text-base font-bold text-gray-900">
            Users
          </h2>

          <p className="text-xs text-gray-400 mt-0.5">
            Manage registered users and purchases
          </p>

        </div>

        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50"
        >
          <Loader2 className="w-4 h-4" />
          Refresh
        </button>

      </div>


      {/* USER STATISTICS */}

      <div className="grid sm:grid-cols-3 gap-4 mb-8">

        <StatCard
          icon={
            <Users className="w-5 h-5 text-blue-700" />
          }
          label="Total Users"
          value={totalUsers}
          color="bg-blue-50"
        />

        <StatCard
          icon={
            <Plus className="w-5 h-5 text-green-600" />
          }
          label="New Today"
          value={newToday}
          color="bg-green-50"
        />

        <StatCard
          icon={
            <FileText className="w-5 h-5 text-purple-600" />
          }
          label="Buyers"
          value={buyers}
          color="bg-purple-50"
        />

      </div>


      {/* SEARCH / FILTER */}

      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">

        <div className="grid md:grid-cols-[1fr_auto_auto] gap-3">

          <div className="relative">

            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              value={search}
              onChange={e =>
                setSearch(e.target.value)
              }
              placeholder="Search by name or email…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />

          </div>


          <select
            value={statusFilter}
            onChange={e =>
              setStatusFilter(
                e.target.value as
                  | "all"
                  | "active"
                  | "suspended"
              )
            }
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm"
          >

            <option value="all">
              All users
            </option>

            <option value="active">
              Active
            </option>

            <option value="suspended">
              Suspended
            </option>

          </select>


          <select
            value={sort}
            onChange={e =>
              setSort(
                e.target.value as
                  | "newest"
                  | "oldest"
              )
            }
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm"
          >

            <option value="newest">
              Newest first
            </option>

            <option value="oldest">
              Oldest first
            </option>

          </select>

        </div>

      </div>


      {/* ERROR */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}


      {/* TABLE */}

      {loading ? (

        <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading users…
        </div>

      ) : processedUsers.length === 0 ? (

        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">

          <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />

          <p className="text-sm text-gray-500">
            No users found
          </p>

        </div>

      ) : (

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b border-gray-100 bg-gray-50">

                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    User
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Joined
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Purchases
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Spent
                  </th>

                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Status
                  </th>

                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {processedUsers.map(user => (

                  <tr
                    key={user.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                  >

                    <td className="px-5 py-4">

                      <div>

                        <p className="font-medium text-gray-900">
                          {user.display_name ||
                            "User"}
                        </p>

                        <p className="text-xs text-gray-400 mt-0.5">
                          {user.email}
                        </p>

                      </div>

                    </td>


                    <td className="px-5 py-4 text-gray-500 text-xs">

                      {new Date(
                        user.created_at
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        }
                      )}

                    </td>


                    <td className="px-5 py-4">

                      <span className="text-sm font-medium text-gray-800">
                        {user.purchaseCount}
                      </span>

                    </td>


                    <td className="px-5 py-4">

                      <span className="font-semibold text-gray-800">
                        ₹
                        {user.spent.toLocaleString(
                          "en-IN"
                        )}
                      </span>

                    </td>


                    <td className="px-5 py-4">

                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          user.status ===
                          "suspended"
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {user.status ===
                        "suspended"
                          ? "Suspended"
                          : "Active"}
                      </span>

                    </td>


                    <td className="px-5 py-4 text-right">

                      <button
                        onClick={() =>
                          openUser(user)
                        }
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                      >
                        View
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* USER DETAILS MODAL */}

      {selectedUser && (

        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() =>
            setSelectedUser(null)
          }
        >

          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={e =>
              e.stopPropagation()
            }
          >

            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">

              <div>

                <h3 className="font-bold text-gray-900">
                  User Details
                </h3>

                <p className="text-xs text-gray-400 mt-1">
                  {selectedUser.email}
                </p>

              </div>

              <button
                onClick={() =>
                  setSelectedUser(null)
                }
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

            </div>


            <div className="p-6">

              <div className="grid sm:grid-cols-3 gap-3 mb-6">

                <div className="bg-blue-50 rounded-xl p-4">

                  <p className="text-xs text-blue-600">
                    Purchases
                  </p>

                  <p className="text-xl font-bold text-blue-800 mt-1">
                    {selectedUser.purchaseCount}
                  </p>

                </div>

                <div className="bg-green-50 rounded-xl p-4">

                  <p className="text-xs text-green-600">
                    Total Spent
                  </p>

                  <p className="text-xl font-bold text-green-800 mt-1">
                    ₹
                    {selectedUser.spent.toLocaleString(
                      "en-IN"
                    )}
                  </p>

                </div>

                <div className="bg-purple-50 rounded-xl p-4">

                  <p className="text-xs text-purple-600">
                    Status
                  </p>

                  <p className="text-xl font-bold text-purple-800 mt-1 capitalize">
                    {selectedUser.status}
                  </p>

                </div>

              </div>


              <div className="mb-6">

                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Registration Date
                </p>

                <p className="text-sm text-gray-800">
                  {new Date(
                    selectedUser.created_at
                  ).toLocaleString("en-IN")}
                </p>

              </div>


              <div>

                <p className="text-xs font-semibold text-gray-500 mb-3">
                  Purchase History
                </p>

                {selectedUser.purchases
                  ?.filter(
                    (p: any) =>
                      p.status ===
                      "completed"
                  ).length === 0 ? (

                  <p className="text-xs text-gray-400 py-5 text-center">
                    No purchases yet.
                  </p>

                ) : (

                  <div className="space-y-2">

                    {selectedUser.purchases
                      ?.filter(
                        (p: any) =>
                          p.status ===
                          "completed"
                      )
                      .map((purchase: any) => (

                        <div
                          key={purchase.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                        >

                          <div>

                            <p className="text-sm font-medium text-gray-800">
                              {purchase.notes
                                ?.title ||
                                "Deleted note"}
                            </p>

                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(
                                purchase.created_at
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </p>

                          </div>

                          <span className="font-semibold text-green-700">
                            ₹
                            {Number(
                              purchase.amount
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>

                        </div>

                      ))}

                  </div>

                )}

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

function NoteAnalytics({
  note,
  onBack,
}: {
  note: Note;
  onBack: () => void;
}) {
  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  const [analytics, setAnalytics] = useState<NoteAnalyticsData>({
    views: 0,
    downloads: 0,
    uniqueViewers: 0,
    uniqueDownloaders: 0,
    todayViews: 0,
    todayDownloads: 0,
    periodViews: 0,
    periodDownloads: 0,
  });

  const [chartData, setChartData] = useState<NoteChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError("");

      try {
        const supabase = getSupabase();

        const now = new Date();

        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - (period - 1));
        periodStart.setHours(0, 0, 0, 0);

        /*
         * -----------------------------------------
         * ALL-TIME VIEWS
         * -----------------------------------------
         */

        const { data: allViews, error: viewsError } = await supabase
          .from("note_views")
          .select("created_at")
          .eq("note_id", note.id);

        if (viewsError) throw viewsError;

        /*
         * -----------------------------------------
         * ALL-TIME DOWNLOADS
         * -----------------------------------------
         */

        const { data: allDownloads, error: downloadsError } = await supabase
          .from("note_downloads")
          .select("created_at")
          .eq("note_id", note.id);

        if (downloadsError) throw downloadsError;

        const views = allViews?.length ?? 0;
        const downloads = allDownloads?.length ?? 0;

        /*
         * -----------------------------------------
         * TODAY
         * -----------------------------------------
         */

        const todayViews =
          allViews?.filter(
            row => new Date(row.created_at) >= todayStart
          ).length ?? 0;

        const todayDownloads =
          allDownloads?.filter(
            row => new Date(row.created_at) >= todayStart
          ).length ?? 0;

        /*
         * -----------------------------------------
         * PERIOD
         * -----------------------------------------
         */

        const periodViewsRows =
          allViews?.filter(
            row => new Date(row.created_at) >= periodStart
          ) ?? [];

        const periodDownloadRows =
          allDownloads?.filter(
            row => new Date(row.created_at) >= periodStart
          ) ?? [];

        /*
         * -----------------------------------------
         * CHART
         * -----------------------------------------
         */

        const chart: NoteChartData[] = [];

        for (let i = period - 1; i >= 0; i--) {
          const start = new Date(now);
          start.setDate(start.getDate() - i);
          start.setHours(0, 0, 0, 0);

          const end = new Date(start);
          end.setDate(end.getDate() + 1);

          const dayViews =
            allViews?.filter(row => {
              const date = new Date(row.created_at);
              return date >= start && date < end;
            }).length ?? 0;

          const dayDownloads =
            allDownloads?.filter(row => {
              const date = new Date(row.created_at);
              return date >= start && date < end;
            }).length ?? 0;

          chart.push({
            date: start.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            }),
            views: dayViews,
            downloads: dayDownloads,
          });
        }

        /*
         * -----------------------------------------
         * UNIQUE USERS
         * -----------------------------------------
         *
         * Only calculate these if user_id exists
         * in the event tables.
         */

        const { data: viewUsers } = await supabase
          .from("note_views")
          .select("user_id")
          .eq("note_id", note.id)
          .not("user_id", "is", null);

        const { data: downloadUsers } = await supabase
          .from("note_downloads")
          .select("user_id")
          .eq("note_id", note.id)
          .not("user_id", "is", null);

        const uniqueViewers = new Set(
          (viewUsers ?? [])
            .map(row => row.user_id)
            .filter(Boolean)
        ).size;

        const uniqueDownloaders = new Set(
          (downloadUsers ?? [])
            .map(row => row.user_id)
            .filter(Boolean)
        ).size;

        setAnalytics({
          views,
          downloads,
          uniqueViewers,
          uniqueDownloaders,
          todayViews,
          todayDownloads,
          periodViews: periodViewsRows.length,
          periodDownloads: periodDownloadRows.length,
        });

        setChartData(chart);

      } catch (err) {
        console.error("Note analytics error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Could not load note analytics."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [note.id, period]);

  const downloadRate =
    analytics.views > 0
      ? ((analytics.downloads / analytics.views) * 100).toFixed(1)
      : "0.0";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading note analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notes
        </button>

        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      </div>
    );
  }

   return (
  <div className="space-y-6 px-5 sm:px-6 py-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">

        <div className="min-w-0">

          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-700 transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notes
          </button>

          <div className="flex items-center gap-3 mb-3">

            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-700" />
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Note Analytics
              </span>

              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {note.title}
              </h2>
            </div>

          </div>

          <p className="text-sm text-gray-500">
            {note.subject}
            {note.note_type ? ` · ${note.note_type}` : ""}
          </p>

        </div>


        {/* Period selector */}

        <div className="flex-shrink-0">

          <label className="block text-xs font-medium text-gray-500 mb-2">
            Analytics period
          </label>

          <select
            value={period}
            onChange={e =>
              setPeriod(Number(e.target.value) as 7 | 30 | 90)
            }
            className="w-full sm:w-auto min-w-[150px] px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

        </div>

      </div>


      {/* =====================================================
          PRIMARY PERFORMANCE
      ===================================================== */}

      <section>

        <div className="flex items-center justify-between mb-3">

          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Performance
            </h3>

            <p className="text-xs text-gray-400 mt-0.5">
              Overall engagement with this note
            </p>
          </div>

        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Views */}

          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-gray-500">
                  Total Views
                </p>

                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {analytics.views}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  All-time note views
                </p>

              </div>

              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-700" />
              </div>

            </div>

          </div>


          {/* Downloads */}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-gray-500">
                  Total Downloads
                </p>

                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {analytics.downloads}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  All-time downloads
                </p>

              </div>

              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                <DownloadIcon />
              </div>

            </div>

          </div>


          {/* Unique viewers */}

          <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-5">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-gray-500">
                  Unique Viewers
                </p>

                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {analytics.uniqueViewers}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Individual users who viewed
                </p>

              </div>

              <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>

            </div>

          </div>


          {/* Unique downloaders */}

          <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-5">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-gray-500">
                  Unique Downloaders
                </p>

                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {analytics.uniqueDownloaders}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Individual users who downloaded
                </p>

              </div>

              <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center">
                <Upload className="w-5 h-5 text-orange-600" />
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          TODAY + CONVERSION
      ===================================================== */}

      <section>

        <div className="flex items-center justify-between mb-3">

          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Today's Activity
            </h3>

            <p className="text-xs text-gray-400 mt-0.5">
              What is happening today
            </p>
          </div>

        </div>


        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Views today */}

          <div className="bg-white border border-gray-200 rounded-2xl p-5">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                <Eye className="w-5 h-5 text-cyan-600" />
              </div>

              <div>

                <p className="text-xs font-medium text-gray-500">
                  Views Today
                </p>

                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {analytics.todayViews}
                </p>

              </div>

            </div>

          </div>


          {/* Downloads today */}

          <div className="bg-white border border-gray-200 rounded-2xl p-5">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DownloadIcon />
              </div>

              <div>

                <p className="text-xs font-medium text-gray-500">
                  Downloads Today
                </p>

                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {analytics.todayDownloads}
                </p>

              </div>

            </div>

          </div>


          {/* Download rate */}

          <div className="bg-white border border-gray-200 rounded-2xl p-5">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>

              <div>

                <p className="text-xs font-medium text-gray-500">
                  Download Rate
                </p>

                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {downloadRate}%
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CHART
      ===================================================== */}

      <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

        <div className="px-5 sm:px-6 py-5 border-b border-gray-100">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>

              <h3 className="text-base font-bold text-gray-900">
                Views & Downloads
              </h3>

              <p className="text-xs text-gray-400 mt-1">
                Daily activity during the selected period
              </p>

            </div>


            {/* Legend */}

            <div className="flex items-center gap-5 text-xs text-gray-500">

              <div className="flex items-center gap-2">

                <span className="w-2.5 h-2.5 rounded-full bg-blue-700" />

                Views

              </div>

              <div className="flex items-center gap-2">

                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />

                Downloads

              </div>

            </div>

          </div>

        </div>


        <div className="px-3 sm:px-6 py-5">

          <ResponsiveContainer width="100%" height={300}>

            <BarChart
              data={chartData}
              barGap={6}
              margin={{
                top: 10,
                right: 5,
                left: -15,
                bottom: 0,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 11,
                  fill: "#9ca3af",
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 11,
                  fill: "#9ca3af",
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                cursor={{
                  fill: "#f8fafc",
                }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
              />

              <Bar
                dataKey="views"
                name="Views"
                fill="#1e40af"
                radius={[5, 5, 0, 0]}
                maxBarSize={28}
              />

              <Bar
                dataKey="downloads"
                name="Downloads"
                fill="#059669"
                radius={[5, 5, 0, 0]}
                maxBarSize={28}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </section>


      {/* =====================================================
          PERIOD SUMMARY
      ===================================================== */}

      <section className="bg-gray-50 border border-gray-200 rounded-2xl p-5">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>

            <p className="text-sm font-semibold text-gray-900">
              Selected Period Summary
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Activity during the last {period} days
            </p>

          </div>


          <div className="flex items-center gap-6">

            <div>

              <p className="text-xs text-gray-400">
                Views
              </p>

              <p className="text-lg font-bold text-gray-900">
                {analytics.periodViews}
              </p>

            </div>


            <div className="w-px h-8 bg-gray-200" />


            <div>

              <p className="text-xs text-gray-400">
                Downloads
              </p>

              <p className="text-lg font-bold text-gray-900">
                {analytics.periodDownloads}
              </p>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="w-5 h-5 text-green-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14"
      />
    </svg>
  );
}

function NotesTab() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [notesError, setNotesError] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [analyticsNote, setAnalyticsNote] = useState<Note | null>(null);
  

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [noteType, setNoteType] = useState("");
const [course, setCourse] = useState("");
const [tagsInput, setTagsInput] = useState("");
const [isFree, setIsFree] = useState(true);
const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchNotes() {
    setLoadingNotes(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setNotes(data ?? []);
    } catch (e) {
      setNotesError("Could not load notes.");
    } finally { setLoadingNotes(false); }
  }

  useEffect(() => { fetchNotes(); }, []);

  function handleFile(f: File | null) {
    setFileError("");
    if (!f) { setFile(null); return; }
    if (!ALLOWED_TYPES.includes(f.type) && !ALLOWED_EXT.some(e => f.name.toLowerCase().endsWith(e))) {
      setFileError("Use PDF, DOC, or DOCX only."); return;
    }
    if (f.size > MAX_MB * 1024 * 1024) { setFileError(`Max file size is ${MAX_MB}MB.`); return; }
    setFile(f);
  }

  function openEdit(note: Note) {
  setEditingNote(note);

  setTitle(note.title);
  setSubject(note.subject);
  setDescription(note.description ?? "");
  setNoteType(note.note_type ?? "");
  setCourse(note.course ?? "");
  setTagsInput(note.tags?.join(", ") ?? "");
  setIsFree(note.is_free);
  setPrice(note.price?.toString() ?? "");

  // File is optional when editing.
  // If no new file is selected, the existing file stays.
  setFile(null);
  setFileError("");
  setUploadStatus("idle");
  setUploadMsg("");

  setShowUpload(true);

  // Scroll to the form
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

  async function handleUpload(e: React.FormEvent) {
  e.preventDefault();

  if (!title.trim() || !subject || !noteType) {
    setUploadMsg("Title, subject, and note type are required.");
    setUploadStatus("error");
    return;
  }

  if (!isFree) {
    const numericPrice = Number(price);

    if (!price || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setUploadMsg("Please enter a valid price for a paid note.");
      setUploadStatus("error");
      return;
    }
  }

  // File is required only when creating a new note.
  if (!editingNote && !file) {
    setUploadMsg("Please select a file.");
    setUploadStatus("error");
    return;
  }

  setUploadStatus("loading");
  setUploadMsg("");

  try {
    const supabase = getSupabase();

    const tags = tagsInput.trim()
      ? tagsInput
          .split(",")
          .map(t => t.trim())
          .filter(Boolean)
      : null;

    /*
     * =========================
     * EDIT EXISTING NOTE
     * =========================
     */
    if (editingNote) {
      let fileUrl = editingNote.file_url;
      let fileName = editingNote.file_name;
      let newFilePath: string | null = null;

      // If a new file was selected, upload it first.
      if (file) {
        const safeName = file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

        newFilePath = `${Date.now()}_${safeName}`;

        const { error: storageErr } = await supabase.storage
          .from("notes_files")
          .upload(newFilePath, file, {
            upsert: false
          });

        if (storageErr) {
          throw new Error(
            `File upload failed: ${storageErr.message}`
          );
        }

        const { data: urlData } = supabase.storage
          .from("notes_files")
          .getPublicUrl(newFilePath);

        if (!urlData?.publicUrl) {
          throw new Error("Could not get new file URL.");
        }

        fileUrl = urlData.publicUrl;
        fileName = file.name;
      }

      // Update database.
      const { error: dbErr } = await supabase
        .from("notes")
        .update({
          title: title.trim(),
          subject,
          description: description.trim() || null,
          note_type: noteType,
          course: course.trim() || null,
          tags,
          is_free: isFree,
          price: isFree ? null : Number(price),
          file_url: fileUrl,
          file_name: fileName
        })
        .eq("id", editingNote.id);

      if (dbErr) {
        // If a new file was uploaded but DB update failed,
        // remove the newly uploaded file.
        if (newFilePath) {
          await supabase.storage
            .from("notes_files")
            .remove([newFilePath]);
        }

        throw new Error(
          `Could not update note: ${dbErr.message}`
        );
      }

      // If the file was replaced, delete the old file.
      if (newFilePath && editingNote.file_url) {
        const oldPath = editingNote.file_url.split(
          "/notes_files/"
        )[1];

        if (oldPath) {
          await supabase.storage
            .from("notes_files")
            .remove([decodeURIComponent(oldPath)]);
        }
      }

      setUploadStatus("success");
      setUploadMsg("Note updated successfully!");

      await fetchNotes();

      setTimeout(() => {
        setUploadStatus("idle");
        setUploadMsg("");
        setShowUpload(false);
        setEditingNote(null);
        setFile(null);
      }, 1200);

      return;
    }

    /*
     * =========================
     * CREATE NEW NOTE
     * =========================
     */

    const safeName = file!.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    const path = `${Date.now()}_${safeName}`;

    const { error: storageErr } = await supabase.storage
      .from("notes_files")
      .upload(path, file!, {
        upsert: false
      });

    if (storageErr) {
      throw new Error(
        `Upload failed: ${storageErr.message}`
      );
    }

    const { data: urlData } = supabase.storage
      .from("notes_files")
      .getPublicUrl(path);

    const fileUrl = urlData?.publicUrl;

    if (!fileUrl) {
      throw new Error("Could not get public URL.");
    }

    const { error: dbErr } = await supabase
      .from("notes")
      .insert({
        title: title.trim(),
        subject,
        description: description.trim() || null,
        note_type: noteType,
        course: course.trim() || null,
        file_url: fileUrl,
        file_name: file!.name,
        tags,
        is_free: isFree,
        price: isFree ? null : Number(price)
      });

    if (dbErr) {
      throw new Error(
        `DB error: ${dbErr.message}`
      );
    }

    setUploadStatus("success");
    setUploadMsg("Note uploaded successfully!");

    setTitle("");
    setSubject("");
    setDescription("");
    setNoteType("");
    setCourse("");
    setTagsInput("");
    setIsFree(true);
    setPrice("");
    setFile(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }

    await fetchNotes();

    setTimeout(() => {
      setUploadStatus("idle");
      setUploadMsg("");
      setShowUpload(false);
    }, 1800);

  } catch (err: unknown) {
    setUploadStatus("error");
    setUploadMsg(
      err instanceof Error
        ? err.message
        : "Operation failed."
    );
  }
}

  async function handleDelete(note: Note) {
  if (!confirm(`Delete "${note.title}"? This cannot be undone.`)) return;

  try {
    const supabase = getSupabase();

    // Delete database record first
    const { error: dbError } = await supabase
      .from("notes")
      .delete()
      .eq("id", note.id);

    if (dbError) {
      console.error("Database delete failed:", dbError);
      alert(`Database delete failed: ${dbError.message}`);
      return;
    }

    // Delete the actual file from Storage
    const pathPart = note.file_url.split("/notes_files/")[1];

    if (pathPart) {
      const { error: storageError } = await supabase
        .storage
        .from("notes_files")
        .remove([pathPart]);

      if (storageError) {
        console.error("Storage delete failed:", storageError);
        alert(
          `Note was deleted from database, but the file could not be deleted: ${storageError.message}`
        );
      }
    }

    // Update UI only after successful database deletion
    setNotes(prev => prev.filter(n => n.id !== note.id));

  } catch (error) {
    console.error("Delete error:", error);
    alert(
      error instanceof Error
        ? error.message
        : "Failed to delete note."
    );
  }
}

function closeForm() {
  setShowUpload(false);
  setEditingNote(null);

  setTitle("");
  setSubject("");
  setDescription("");
  setNoteType("");
  setCourse("");
  setTagsInput("");
  setIsFree(true);
  setPrice("");
  setFile(null);
  setFileError("");
  setUploadStatus("idle");
  setUploadMsg("");

  if (fileRef.current) {
    fileRef.current.value = "";
  }
}

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-700 transition-colors";
  const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-gray-900">Notes Manager</h2>
          <p className="text-xs text-gray-400 mt-0.5">{notes.length} note{notes.length !== 1 ? "s" : ""} published</p>
        </div>

        <button
  onClick={() => {
    if (showUpload) {
      closeForm();
    } else {
      setShowUpload(true);
      setEditingNote(null);
    }
  }}
  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-800 text-white text-sm font-semibold hover:bg-blue-900 transition-colors"
>
          {showUpload ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Upload Note
            </>
          )}
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
  {editingNote ? (
    <>
      <Pencil className="w-4 h-4 text-blue-600" />
      Edit Note
    </>
  ) : (
    <>
      <Upload className="w-4 h-4 text-blue-600" />
      Upload New Note
    </>
  )}
</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Title <span className="text-red-400">*</span></label>
                <input className={inputClass} placeholder="e.g. Forensic Toxicology Unit 2" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Subject <span className="text-red-400">*</span></label>
                <select className={inputClass} value={subject} onChange={e => setSubject(e.target.value)}>
                  <option value="">Select subject</option>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Brief description of what's covered…" value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
  <div>
    <label className={labelClass}>
      Note Type <span className="text-red-400">*</span>
    </label>

    <select
      className={inputClass}
      value={noteType}
      onChange={e => setNoteType(e.target.value)}
    >
      <option value="">Select note type</option>
      <option value="Detailed Notes">Detailed Notes</option>
      <option value="Revision Notes">Revision Notes</option>
    </select>
  </div>

  <div>
    <label className={labelClass}>Course</label>

    <input
      className={inputClass}
      placeholder="e.g. B.Sc Forensic Science"
      value={course}
      onChange={e => setCourse(e.target.value)}
    />
  </div>
</div>

            <div>
              <label className={labelClass}>Tags <span className="font-normal text-gray-400">(comma-separated)</span></label>
              <input className={inputClass} placeholder="e.g. toxicology, poisons, unit-2" value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
            </div>

            <div>
              <label className={labelClass}>
  File{" "}
  {!editingNote && (
    <span className="text-red-400">*</span>
  )}
  {editingNote && (
    <span className="font-normal text-gray-400">
      (optional — select only to replace the current file)
    </span>
  )}
</label>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0] ?? null); }}
                className={`cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-colors ${file ? "border-cyan-400 bg-blue-50/40" : "border-gray-200 bg-gray-50 hover:border-cyan-400"}`}
              >
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => handleFile(e.target.files?.[0] ?? null)} />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4 text-blue-700" />
                    <span className="text-sm text-gray-700 font-medium truncate max-w-xs">{file.name}</span>
                    <button type="button" onClick={ev => { ev.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="p-1 rounded-full hover:bg-gray-200">
                      <X className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
                   <p className="text-sm text-gray-500">
  <span className="text-blue-700 font-medium">
    Click to upload
  </span>{" "}
  or drag & drop
</p>

{editingNote && (
  <p className="text-xs text-gray-400 mt-1">
    Leave empty to keep the current file
  </p>
)}
                    <p className="text-xs text-gray-400 mt-0.5">PDF, DOC, DOCX — max {MAX_MB}MB</p>
                  </div>
                )}
              </div>
              {fileError && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fileError}</p>}
            </div>

            <div className="space-y-3">
  <label className={labelClass}>
    Access <span className="text-red-400">*</span>
  </label>

  <div className="flex flex-wrap gap-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="note-access"
        checked={isFree}
        onChange={() => setIsFree(true)}
        className="accent-blue-800"
      />
      <span className="text-sm text-gray-700">Free</span>
    </label>

    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="note-access"
        checked={!isFree}
        onChange={() => setIsFree(false)}
        className="accent-blue-800"
      />
      <span className="text-sm text-gray-700">Paid</span>
    </label>
  </div>

  {!isFree && (
    <div>
      <label className={labelClass}>
        Price (₹) <span className="text-red-400">*</span>
      </label>

      <input
        type="number"
        min="1"
        step="1"
        className={inputClass}
        placeholder="e.g. 49"
        value={price}
        onChange={e => setPrice(e.target.value)}
      />

      <p className="text-xs text-gray-400 mt-1">
        Enter the selling price in Indian Rupees.
      </p>
    </div>
  )}
</div>

{uploadMsg && (
              <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${uploadStatus === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                {uploadStatus === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {uploadMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={uploadStatus === "loading"}
              className="w-full py-2.5 rounded-xl bg-blue-800 text-white text-sm font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploadStatus === "loading" ? (
  <>
    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    {editingNote ? "Saving changes…" : "Uploading…"}
  </>
) : editingNote ? (
  "Save Changes"
) : (
  "Publish Note"
)}
            </button>
          </form>
        </div>
      )}

      {/* Notes List */}
      {loadingNotes ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
          <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> Loading…
        </div>
      ) : notesError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{notesError}</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-7 h-7 text-blue-300" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No notes yet</p>
          <p className="text-gray-400 text-xs mt-1">Upload your first note above.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Title</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Subject</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">
  Type
</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Added</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map(n => (
                <tr key={n.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[200px] truncate">{n.title}</td>
                  <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{n.subject}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs hidden lg:table-cell">
  {n.note_type ?? "—"}
</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs hidden sm:table-cell">
                    {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                   <div className="flex items-center justify-end gap-2">

                    <button
  onClick={() => setAnalyticsNote(n)}
  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:text-indigo-800 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
  title="View note analytics"
>
  <BarChart3 className="w-3.5 h-3.5" />
  Analytics
</button>

  <a
    href={n.file_url}
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs text-blue-700 font-semibold hover:text-blue-900 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
  >
    View
  </a>

  <button
    onClick={() => openEdit(n)}
    className="inline-flex items-center gap-1.5 text-xs text-gray-600 font-semibold hover:text-blue-700 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
    title="Edit note"
  >
    <Pencil className="w-3.5 h-3.5" />
    Edit
  </button>

  <button
    onClick={() => handleDelete(n)}
    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    title="Delete note"
  >
    <Trash2 className="w-3.5 h-3.5" />
  </button>

</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
            )}

            {/* ================= NOTE ANALYTICS ================= */}
      {analyticsNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setAnalyticsNote(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <NoteAnalytics
              note={analyticsNote}
              onBack={() => setAnalyticsNote(null)}
            />
          </div>
        </div>
      )}
    </div>
    );
}

function TestimonialsTab() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [testimonialError, setTestimonialError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchTestimonials() {
    setLoadingTestimonials(true);
    setTestimonialError("");

    try {
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTestimonials(data ?? []);
    } catch (error) {
      console.error("Failed to load testimonials:", error);
      setTestimonialError(
        error instanceof Error
          ? error.message
          : "Could not load testimonials."
      );
    } finally {
      setLoadingTestimonials(false);
    }
  }

  useEffect(() => {
    fetchTestimonials();
  }, []);

  async function updateStatus(
    testimonial: Testimonial,
    status: "approved" | "rejected" | "pending"
  ) {
    setUpdatingId(testimonial.id);
    setTestimonialError("");

    try {
      const supabase = getSupabase();

      const { error } = await supabase
        .from("testimonials")
        .update({ status })
        .eq("id", testimonial.id);

      if (error) throw error;

      setTestimonials(prev =>
        prev.map(item =>
          item.id === testimonial.id
            ? { ...item, status }
            : item
        )
      );
    } catch (error) {
      console.error("Failed to update testimonial:", error);

      setTestimonialError(
        error instanceof Error
          ? error.message
          : "Could not update testimonial."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const pendingCount = testimonials.filter(
    t => t.status === "pending"
  ).length;

  const approvedCount = testimonials.filter(
    t => t.status === "approved"
  ).length;

  const rejectedCount = testimonials.filter(
    t => t.status === "rejected"
  ).length;

  if (loadingTestimonials) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading testimonials…
      </div>
    );
  }

  return (
    <div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            Testimonials Manager
          </h2>

          <p className="text-xs text-gray-400 mt-0.5">
            Review and manage user testimonials
          </p>
        </div>

        <button
          onClick={fetchTestimonials}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          <Loader2 className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Error */}
      {testimonialError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {testimonialError}
        </div>
      )}

      {/* Statistics */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">

        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-yellow-600" />}
          label="Pending Review"
          value={pendingCount}
          color="bg-yellow-50"
        />

        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          label="Approved"
          value={approvedCount}
          color="bg-green-50"
        />

        <StatCard
          icon={<X className="w-5 h-5 text-red-600" />}
          label="Rejected"
          value={rejectedCount}
          color="bg-red-50"
        />

      </div>

      {/* Empty state */}
      {testimonials.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm text-center py-20">

          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <MessageSquareQuote className="w-7 h-7 text-blue-300" />
          </div>

          <p className="text-gray-500 text-sm font-medium">
            No testimonials yet
          </p>

          <p className="text-gray-400 text-xs mt-1">
            User testimonials will appear here.
          </p>

        </div>
      ) : (

        <div className="space-y-4">

          {testimonials.map(testimonial => (

            <div
              key={testimonial.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
            >

              {/* Top row */}
              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <MessageSquareQuote className="w-5 h-5 text-blue-700" />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.display_name}
                    </p>

                    <p className="text-xs text-gray-400">
                      {new Date(
                        testimonial.created_at
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                  </div>

                </div>

                {/* Status */}
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    testimonial.status === "pending"
                      ? "bg-yellow-50 text-yellow-700"
                      : testimonial.status === "approved"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {testimonial.status.charAt(0).toUpperCase() +
                    testimonial.status.slice(1)}
                </span>

              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mt-5">

                {[1, 2, 3, 4, 5].map(star => (

                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= testimonial.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />

                ))}

                <span className="text-xs text-gray-400 ml-2">
                  {testimonial.rating}/5
                </span>

              </div>

              {/* Content */}
              <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-4">

                <p className="text-sm text-gray-700 leading-relaxed">
                  {testimonial.content}
                </p>

              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-5">

                {testimonial.status !== "approved" && (
                  <button
                    onClick={() =>
                      updateStatus(testimonial, "approved")
                    }
                    disabled={updatingId === testimonial.id}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updatingId === testimonial.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}

                    Approve
                  </button>
                )}

                {testimonial.status !== "rejected" && (
                  <button
                    onClick={() =>
                      updateStatus(testimonial, "rejected")
                    }
                    disabled={updatingId === testimonial.id}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                )}

                {testimonial.status !== "pending" && (
                  <button
                    onClick={() =>
                      updateStatus(testimonial, "pending")
                    }
                    disabled={updatingId === testimonial.id}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Set Pending
                  </button>
                )}

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}

export function Admin() {
  const [, navigate] = useLocation();
  const [authChecking, setAuthChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<
  "analytics" | "users" | "notes" | "testimonials"
>("analytics");

  useEffect(() => {
    const supabase = getSupabase();
    let mounted = true;

    async function checkAdminAccess() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const isAdmin = session?.user?.app_metadata?.role === "admin";

        if (!isAdmin) {
          if (mounted) {
            setAuthed(false);
            setAuthChecking(false);
          }
          navigate("/auth/login");
          return;
        }

        if (mounted) {
          setAuthed(true);
          setAuthChecking(false);
        }
      } catch (error) {
        console.error("Admin authentication check failed:", error);

        if (mounted) {
          setAuthed(false);
          setAuthChecking(false);
        }

        navigate("/auth/login");
      }
    }

    checkAdminAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAdmin = session?.user?.app_metadata?.role === "admin";

      if (!isAdmin) {
        setAuthed(false);
        navigate("/auth/login");
      } else {
        setAuthed(true);
      }

      setAuthChecking(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  async function handleLogout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    navigate("/auth/login");
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          Checking admin access…
        </div>
      </div>
    );
  }

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <span className="text-gray-300">|</span>
            <img src="/logo.png" alt="Evidentia" className="object-contain" style={{ width: "120px" }} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">Admin Dashboard</span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-6xl mx-auto flex gap-1">
          {([
  {
    id: "analytics",
    label: "Analytics",
    icon: <Eye className="w-3.5 h-3.5" />
  },
   {
    id: "users",
    label: "Users",
    icon: <Users className="w-3.5 h-3.5" />
  },
  {
    id: "notes",
    label: "Notes Manager",
    icon: <BookOpen className="w-3.5 h-3.5" />
  },
  {
    id: "testimonials",
    label: "Testimonials",
    icon: <MessageSquareQuote className="w-3.5 h-3.5" />
  },
] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? "border-blue-700 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
  {tab === "analytics" && <AnalyticsTab />}
  {tab === "users" && <UsersTab />}
  {tab === "notes" && <NotesTab />}
  {tab === "testimonials" && <TestimonialsTab />}
</div>
    </div>
  );
}