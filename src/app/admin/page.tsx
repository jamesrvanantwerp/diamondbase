"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Calendar, DollarSign, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

const TIER_RATES: Record<string, number> = { Silver: 50, Gold: 90, Platinum: 150 };

type Booking = {
  id: string;
  time: string;
  cage_type: string;
  payment_method: string;
  status: string;
  member_name: string | null;
  date: string;
};

type Member = {
  id: string;
  name: string;
  email: string;
  tier: string;
  credits_total: number;
  credits_used: number;
  member_since: string;
};

export default function AdminPage() {
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [revenue, setRevenue] = useState({ total: 0, expenses: 0 });
  const [memberCount, setMemberCount] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const currentMonthAbbr = new Date().toLocaleDateString("en-US", { month: "short" });
      const currentYear = new Date().getFullYear();
      const currentMonthIndex = new Date().getMonth();

      const [{ data: bookings }, { data: expLogs }, { data: revLogs }, { data: memberRows }, { data: allBookings }] = await Promise.all([
        supabase.from("bookings").select("*").eq("date", today).eq("status", "confirmed").order("time"),
        supabase.from("expense_logs").select("amount, date"),
        supabase.from("revenue_logs").select("amount, date"),
        supabase.from("members").select("id, name, email, tier, credits_total, credits_used, member_since").order("member_since", { ascending: false }),
        supabase.from("bookings").select("payment_method, date").eq("status", "confirmed"),
      ]);

      if (bookings) setTodayBookings(bookings);
      if (memberRows) { setMemberCount(memberRows.length); setMembers(memberRows); }

      // Expenses: sum expense_logs for current month
      const totalExpenses = (expLogs ?? [])
        .filter((e) => { const d = new Date(e.date + "T12:00:00"); return d.getFullYear() === currentYear && d.getMonth() === currentMonthIndex; })
        .reduce((s, e) => s + e.amount, 0);

      // Revenue: memberships + card bookings + manual logs
      const membershipRev = (memberRows ?? []).reduce((s, m) => s + (TIER_RATES[m.tier] ?? 0), 0);
      const bookingRev = (allBookings ?? [])
        .filter((b) => { const parts = b.date?.split(" "); return parts?.[0] === currentMonthAbbr && parts?.[2] === String(currentYear); })
        .reduce((s, b) => { const match = b.payment_method?.match(/\$(\d+)/); return s + (match ? parseInt(match[1]) : 0); }, 0);
      const manualRev = (revLogs ?? [])
        .filter((r) => { const d = new Date(r.date + "T12:00:00"); return d.getFullYear() === currentYear && d.getMonth() === currentMonthIndex; })
        .reduce((s, r) => s + r.amount, 0);

      setRevenue({ total: membershipRev + bookingRev + manualRev, expenses: totalExpenses });
      setLoading(false);
    };

    fetchData();

    // Real-time: refresh when bookings, revenue, or expenses change
    const channel = supabase
      .channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "expense_logs" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "revenue_logs" }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const netProfit = revenue.total - revenue.expenses;

  // Build membership mix from real members data
  const tierCounts = members.reduce<Record<string, number>>((acc, m) => {
    acc[m.tier] = (acc[m.tier] ?? 0) + 1;
    return acc;
  }, {});
  const liveBreakdown = Object.entries(tierCounts).map(([tier, count]) => ({
    tier,
    count,
    revenue: count * (TIER_RATES[tier] ?? 50),
  }));

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">DiamondBase Facility — {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/employees" className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
              <Users className="h-4 w-4" /> Staff Schedule
            </Link>
            <Link href="/admin/finances" className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Financials
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Monthly Revenue", value: `$${revenue.total.toLocaleString()}`, sub: "+10.5% vs last month", color: "text-green-400", icon: DollarSign },
            { label: "Monthly Expenses", value: `$${revenue.expenses.toLocaleString()}`, sub: "Labor, utilities, software", color: "text-red-400", icon: TrendingUp },
            { label: "Net Profit", value: `$${netProfit.toLocaleString()}`, sub: `${((netProfit / revenue.total) * 100).toFixed(0)}% margin`, color: "text-blue-400", icon: DollarSign },
            { label: "Active Members", value: memberCount.toString(), sub: "Registered accounts", color: "text-purple-400", icon: Users },
          ].map((k) => (
            <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <k.icon className={`h-5 w-5 ${k.color} mb-2`} />
              <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
              <p className="text-white text-sm font-medium mt-1">{k.label}</p>
              <p className="text-gray-500 text-xs">{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Bookings */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                <h2 className="text-white font-bold">Today&apos;s Bookings</h2>
              </div>
              <span className="text-gray-400 text-sm">{todayBookings.length} {todayBookings.length === 1 ? "booking" : "bookings"}</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : todayBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No bookings yet today.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {todayBookings.map((b) => (
                  <div key={b.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 text-sm w-16 flex-shrink-0">{b.time}</span>
                      <div>
                        <p className="text-white text-sm font-medium">{b.member_name ?? "Guest"}</p>
                        <p className="text-gray-500 text-xs">{b.cage_type} · {b.payment_method}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400">
                      confirmed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Member Breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-white font-bold mb-4">Membership Mix</h2>
              <div className="space-y-3">
                {liveBreakdown.length === 0 ? (
                  <p className="text-gray-500 text-sm">No members yet.</p>
                ) : liveBreakdown.map((m) => (
                  <div key={m.tier} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm truncate flex-1 min-w-0">{m.tier}</span>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <span className="text-gray-500 text-xs">{m.count} member{m.count !== 1 ? "s" : ""}</span>
                      <span className="text-green-400 text-xs font-semibold">${m.revenue}/mo</span>
                    </div>
                  </div>
                ))}
                {liveBreakdown.length > 0 && (
                  <div className="border-t border-gray-800 pt-2 flex justify-between">
                    <span className="text-white font-semibold text-sm">Total</span>
                    <span className="text-green-400 font-bold">${liveBreakdown.reduce((a, b) => a + b.revenue, 0).toLocaleString()}/mo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <h2 className="text-white font-bold">Alerts</h2>
              </div>
              <div className="space-y-3">
                <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-xl p-3">
                  <p className="text-yellow-300 text-sm font-medium">1 No-Show Today</p>
                  <p className="text-gray-400 text-xs">9:30 AM slot · $15 fee pending</p>
                </div>
                <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3">
                  <p className="text-blue-300 text-sm font-medium">HitTrax Sync Active</p>
                  <p className="text-gray-400 text-xs">Last synced 4 min ago</p>
                </div>
                <div className="bg-green-950/20 border border-green-500/20 rounded-xl p-3">
                  <p className="text-green-300 text-sm font-medium">Door Access Online</p>
                  <p className="text-gray-400 text-xs">Keypad responding normally</p>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/employees" className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 text-center transition-colors">
                <Clock className="h-6 w-6 text-orange-400 mx-auto mb-1" />
                <p className="text-white text-sm font-medium">Staff</p>
              </Link>
              <Link href="/admin/finances" className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 text-center transition-colors">
                <DollarSign className="h-6 w-6 text-green-400 mx-auto mb-1" />
                <p className="text-white text-sm font-medium">Finances</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Active Members Table */}
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400" />
              <h2 className="text-white font-bold">Active Members</h2>
            </div>
            <span className="text-gray-400 text-sm">{members.length} registered</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">No members yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-6 py-3">Name</th>
                    <th className="text-left px-6 py-3">Email</th>
                    <th className="text-left px-6 py-3">Tier</th>
                    <th className="text-left px-6 py-3">Credits</th>
                    <th className="text-left px-6 py-3">Member Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-3 text-white font-medium">{m.name}</td>
                      <td className="px-6 py-3 text-gray-400">{m.email}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          {m.tier}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`font-medium ${m.credits_used >= m.credits_total ? "text-red-400" : "text-green-400"}`}>
                          {m.credits_total - m.credits_used}
                        </span>
                        <span className="text-gray-600"> / {m.credits_total}</span>
                      </td>
                      <td className="px-6 py-3 text-gray-400">
                        {m.member_since ? new Date(m.member_since).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
