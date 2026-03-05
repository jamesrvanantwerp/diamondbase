"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const TIER_RATES: Record<string, number> = { Silver: 50, Gold: 90, Platinum: 150 };
const EXPENSE_CATEGORIES = ["Labor", "Rent / Lease", "Equipment", "Utilities", "Maintenance", "Software", "Insurance", "Marketing", "Other"];
const REVENUE_SOURCES = ["Retail", "Event", "Sponsorship", "Other"];

type ExpenseLog = { id: string; date: string; amount: number; category: string; description: string };
type RevenueLog = { id: string; date: string; amount: number; source: string; description: string };

const now = new Date();
const currentMonthAbbr = now.toLocaleDateString("en-US", { month: "short" });
const currentYear = now.getFullYear();
const currentMonthLabel = now.toLocaleDateString("en-US", { month: "short", year: "numeric" });
const todayStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

function isThisMonth(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.getFullYear() === currentYear && d.getMonth() === now.getMonth();
}

export default function FinancesPage() {
  const [tab, setTab] = useState<"revenue" | "expenses">("revenue");
  const [expenseLogs, setExpenseLogs] = useState<ExpenseLog[]>([]);
  const [revenueLogs, setRevenueLogs] = useState<RevenueLog[]>([]);
  const [membershipRevenue, setMembershipRevenue] = useState(0);
  const [bookingRevenue, setBookingRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [expForm, setExpForm] = useState({ date: todayStr, amount: "", category: "Rent / Lease", description: "" });
  const [revForm, setRevForm] = useState({ date: todayStr, amount: "", source: "Retail", description: "" });

  const loadData = async () => {
    const [{ data: exp }, { data: rev }, { data: members }, { data: bookings }] = await Promise.all([
      supabase.from("expense_logs").select("*").order("date", { ascending: false }),
      supabase.from("revenue_logs").select("*").order("date", { ascending: false }),
      supabase.from("members").select("tier"),
      supabase.from("bookings").select("payment_method, date").eq("status", "confirmed"),
    ]);

    if (exp) setExpenseLogs(exp);
    if (rev) setRevenueLogs(rev);

    if (members) {
      setMembershipRevenue(members.reduce((sum, m) => sum + (TIER_RATES[m.tier] ?? 0), 0));
    }

    if (bookings) {
      const cardRevenue = bookings
        .filter((b) => {
          const parts = b.date?.split(" ");
          return parts?.[0] === currentMonthAbbr && parts?.[2] === String(currentYear);
        })
        .reduce((sum, b) => {
          const match = b.payment_method?.match(/\$(\d+)/);
          return sum + (match ? parseInt(match[1]) : 0);
        }, 0);
      setBookingRevenue(cardRevenue);
    }

    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const addExpense = async () => {
    if (!expForm.amount) return;
    setSaving(true);
    await supabase.from("expense_logs").insert([{
      date: expForm.date, amount: parseFloat(expForm.amount),
      category: expForm.category, description: expForm.description,
    }]);
    setExpForm((p) => ({ ...p, amount: "", description: "" }));
    await loadData();
    setSaving(false);
  };

  const addRevenue = async () => {
    if (!revForm.amount) return;
    setSaving(true);
    await supabase.from("revenue_logs").insert([{
      date: revForm.date, amount: parseFloat(revForm.amount),
      source: revForm.source, description: revForm.description,
    }]);
    setRevForm((p) => ({ ...p, amount: "", description: "" }));
    await loadData();
    setSaving(false);
  };

  const deleteExpense = async (id: string) => {
    await supabase.from("expense_logs").delete().eq("id", id);
    setExpenseLogs((prev) => prev.filter((e) => e.id !== id));
  };

  const deleteRevenue = async (id: string) => {
    await supabase.from("revenue_logs").delete().eq("id", id);
    setRevenueLogs((prev) => prev.filter((r) => r.id !== id));
  };

  const thisMonthExpenses = expenseLogs.filter((e) => isThisMonth(e.date));
  const thisMonthManualRevenue = revenueLogs.filter((r) => isThisMonth(r.date));
  const totalExpenses = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const manualRevenueTotal = thisMonthManualRevenue.reduce((s, r) => s + r.amount, 0);
  const totalRevenue = membershipRevenue + bookingRevenue + manualRevenueTotal;
  const netProfit = totalRevenue - totalExpenses;

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Financial Dashboard</h1>
        </div>
        <p className="text-gray-400 mb-8 ml-8">{currentMonthLabel}</p>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <TrendingUp className="h-5 w-5 text-green-400 mb-2" />
            <p className="text-2xl font-black text-green-400">${totalRevenue.toLocaleString()}</p>
            <p className="text-white text-sm font-medium mt-1">Monthly Revenue</p>
            <p className="text-gray-500 text-xs">Memberships + Bookings + Manual</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <TrendingDown className="h-5 w-5 text-red-400 mb-2" />
            <p className="text-2xl font-black text-red-400">${totalExpenses.toLocaleString()}</p>
            <p className="text-white text-sm font-medium mt-1">Monthly Expenses</p>
            <p className="text-gray-500 text-xs">{thisMonthExpenses.length} entries logged</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className={`text-2xl font-black ${netProfit >= 0 ? "text-blue-400" : "text-orange-400"}`}>
              ${netProfit.toLocaleString()}
            </p>
            <p className="text-white text-sm font-medium mt-1">Net Profit</p>
            <p className="text-gray-500 text-xs">
              {totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(0)}% margin` : "—"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
          <button onClick={() => setTab("revenue")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "revenue" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"}`}>
            Revenue
          </button>
          <button onClick={() => setTab("expenses")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "expenses" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"}`}>
            Expenses
          </button>
        </div>

        {/* ── REVENUE TAB ── */}
        {tab === "revenue" && (
          <div className="space-y-6">

            {/* Auto-generated breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-white font-bold mb-4">
                Auto-Generated Revenue
                <span className="text-gray-500 text-xs font-normal ml-2">{currentMonthLabel}</span>
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2.5 border-b border-gray-800">
                  <div>
                    <p className="text-white text-sm font-medium">Memberships</p>
                    <p className="text-gray-500 text-xs">Silver × $50 · Gold × $90 · Platinum × $150</p>
                  </div>
                  <span className="text-green-400 font-bold text-lg">${membershipRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-800">
                  <div>
                    <p className="text-white text-sm font-medium">Cage Bookings (card payments)</p>
                    <p className="text-gray-500 text-xs">Confirmed bookings paid by card this month</p>
                  </div>
                  <span className="text-green-400 font-bold text-lg">${bookingRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <div>
                    <p className="text-white text-sm font-medium">Manual entries</p>
                    <p className="text-gray-500 text-xs">{thisMonthManualRevenue.length} entries logged this month</p>
                  </div>
                  <span className="text-green-400 font-bold text-lg">${manualRevenueTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Add Manual Revenue */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-white font-bold mb-4">Log Manual Revenue Entry</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Date</label>
                  <input type="date" value={revForm.date}
                    onChange={(e) => setRevForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                    style={{ colorScheme: "dark" }} />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Amount</label>
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus-within:border-green-500">
                    <span className="text-gray-500 text-sm mr-1">$</span>
                    <input type="number" min={0} placeholder="0" value={revForm.amount}
                      onChange={(e) => setRevForm((p) => ({ ...p, amount: e.target.value }))}
                      className="bg-transparent text-white text-sm w-full outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Source</label>
                  <select value={revForm.source} onChange={(e) => setRevForm((p) => ({ ...p, source: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500">
                    {REVENUE_SOURCES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Description</label>
                  <input type="text" placeholder="e.g. team event" value={revForm.description}
                    onChange={(e) => setRevForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500" />
                </div>
              </div>
              <button onClick={addRevenue} disabled={saving || !revForm.amount}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                <Plus className="h-4 w-4" /> Add Revenue Entry
              </button>
            </div>

            {/* Revenue Log */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-white font-bold">Manual Revenue Log</h2>
                <span className="text-gray-500 text-sm">{revenueLogs.length} entries</span>
              </div>
              {revenueLogs.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-10">No manual revenue entries yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                      <th className="text-left px-6 py-3">Date</th>
                      <th className="text-left px-6 py-3">Source</th>
                      <th className="text-left px-6 py-3">Description</th>
                      <th className="text-right px-6 py-3">Amount</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {revenueLogs.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-800/30 transition-colors group">
                        <td className="px-6 py-3 text-gray-400">{formatDate(r.date)}</td>
                        <td className="px-6 py-3">
                          <span className="bg-green-500/10 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-500/20">{r.source}</span>
                        </td>
                        <td className="px-6 py-3 text-gray-300">{r.description || "—"}</td>
                        <td className="px-6 py-3 text-right text-green-400 font-semibold">${Number(r.amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => deleteRevenue(r.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── EXPENSES TAB ── */}
        {tab === "expenses" && (
          <div className="space-y-6">

            {/* Add Expense */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-white font-bold mb-4">Log Expense</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Date</label>
                  <input type="date" value={expForm.date}
                    onChange={(e) => setExpForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500"
                    style={{ colorScheme: "dark" }} />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Amount</label>
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus-within:border-red-500">
                    <span className="text-gray-500 text-sm mr-1">$</span>
                    <input type="number" min={0} placeholder="0" value={expForm.amount}
                      onChange={(e) => setExpForm((p) => ({ ...p, amount: e.target.value }))}
                      className="bg-transparent text-white text-sm w-full outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Category</label>
                  <select value={expForm.category} onChange={(e) => setExpForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500">
                    {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Description</label>
                  <input type="text" placeholder="e.g. March rent" value={expForm.description}
                    onChange={(e) => setExpForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500" />
                </div>
              </div>
              <button onClick={addExpense} disabled={saving || !expForm.amount}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                <Plus className="h-4 w-4" /> Add Expense
              </button>
            </div>

            {/* Expense Log */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-white font-bold">Expense Log</h2>
                <span className="text-gray-500 text-sm">
                  {expenseLogs.length} entries ·{" "}
                  <span className="text-red-400 font-semibold">${totalExpenses.toLocaleString()}</span> this month
                </span>
              </div>
              {expenseLogs.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-10">No expenses logged yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                      <th className="text-left px-6 py-3">Date</th>
                      <th className="text-left px-6 py-3">Category</th>
                      <th className="text-left px-6 py-3">Description</th>
                      <th className="text-right px-6 py-3">Amount</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {expenseLogs.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-800/30 transition-colors group">
                        <td className="px-6 py-3 text-gray-400">{formatDate(e.date)}</td>
                        <td className="px-6 py-3">
                          <span className="bg-red-500/10 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-500/20">{e.category}</span>
                        </td>
                        <td className="px-6 py-3 text-gray-300">{e.description || "—"}</td>
                        <td className="px-6 py-3 text-right text-red-400 font-semibold">${Number(e.amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => deleteExpense(e.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
