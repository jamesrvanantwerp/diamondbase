"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart as RechartsPie, Pie, Cell,
} from "recharts";
import { supabase } from "@/lib/supabase";

const COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#f97316", "#ef4444"];

type RevenueRow = { month: string; memberships: number; one_off: number; retail: number; total: number };
type ExpenseRow = { month: string; labor: number; utilities: number; maintenance: number; software: number; lease: number; equipment: number; total: number };

const currentMonth = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

export default function FinancesPage() {
  const [revenue, setRevenue] = useState<RevenueRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [expForm, setExpForm] = useState({ labor: 0, utilities: 0, maintenance: 0, software: 0, lease: 0, equipment: 0 });
  const [revForm, setRevForm] = useState({ memberships: 0, one_off: 0, retail: 0 });

  const loadData = async () => {
    const [{ data: rev }, { data: exp }] = await Promise.all([
      supabase.from("revenue_entries").select("*").order("created_at"),
      supabase.from("expense_entries").select("*").order("created_at"),
    ]);
    if (rev) {
      setRevenue(rev);
      const cur = rev.find((r) => r.month === currentMonth);
      if (cur) setRevForm({ memberships: cur.memberships, one_off: cur.one_off, retail: cur.retail });
    }
    if (exp) {
      setExpenses(exp);
      const cur = exp.find((e) => e.month === currentMonth);
      if (cur) setExpForm({ labor: cur.labor, utilities: cur.utilities, maintenance: cur.maintenance, software: cur.software, lease: cur.lease ?? 0, equipment: cur.equipment ?? 0 });
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const saveExpenses = async () => {
    setSaving(true);
    setSaveMsg(null);
    const total = expForm.labor + expForm.utilities + expForm.maintenance + expForm.software + expForm.lease + expForm.equipment;
    await supabase.from("expense_entries").upsert({ month: currentMonth, ...expForm, total }, { onConflict: "month" });
    await loadData();
    setSaving(false);
    setSaveMsg("Expenses saved!");
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const saveRevenue = async () => {
    setSaving(true);
    setSaveMsg(null);
    const total = revForm.memberships + revForm.one_off + revForm.retail;
    await supabase.from("revenue_entries").upsert({ month: currentMonth, ...revForm, total }, { onConflict: "month" });
    await loadData();
    setSaving(false);
    setSaveMsg("Revenue saved!");
    setTimeout(() => setSaveMsg(null), 3000);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const combined = revenue.map((r, i) => ({
    month: r.month,
    Revenue: r.total,
    Expenses: expenses[i]?.total ?? 0,
    Profit: r.total - (expenses[i]?.total ?? 0),
  }));

  const latest = combined[combined.length - 1] ?? { Revenue: 0, Expenses: 0, Profit: 0 };
  const prev = combined[combined.length - 2] ?? { Revenue: 0 };
  const revenueGrowth = prev.Revenue ? (((latest.Revenue - prev.Revenue) / prev.Revenue) * 100).toFixed(1) : "0";
  const profitMargin = latest.Revenue ? ((latest.Profit / latest.Revenue) * 100).toFixed(0) : "0";

  const latestRev = revenue[revenue.length - 1];
  const latestExp = expenses[expenses.length - 1];

  const revBreakdown = latestRev ? [
    { name: "Memberships", value: latestRev.memberships },
    { name: "One-off Bookings", value: latestRev.one_off },
    { name: "Retail", value: latestRev.retail },
  ] : [];

  const expBreakdown = latestExp ? [
    { name: "Labor", value: latestExp.labor },
    { name: "Utilities", value: latestExp.utilities },
    { name: "Maintenance", value: latestExp.maintenance },
    { name: "Software", value: latestExp.software },
    { name: "Lease", value: latestExp.lease ?? 0 },
    { name: "Equipment", value: latestExp.equipment ?? 0 },
  ].filter(e => e.value > 0) : [];

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Financial Dashboard</h1>
        </div>
        <p className="text-gray-400 mb-8 ml-8">Live data from Supabase · Sep 2025 – Mar 2026</p>

        {/* Entry Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Expense Entry */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-bold">Log Expenses</h2>
                <p className="text-gray-500 text-xs mt-0.5">{currentMonth} · updates charts below</p>
              </div>
              <TrendingDown className="h-5 w-5 text-red-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(["labor", "utilities", "maintenance", "software", "lease", "equipment"] as const).map((field) => (
                <div key={field}>
                  <label className="text-gray-400 text-xs capitalize mb-1 block">{field}</label>
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus-within:border-blue-500">
                    <span className="text-gray-500 text-sm mr-1">$</span>
                    <input
                      type="number" min={0}
                      value={expForm[field] || ""}
                      onChange={(e) => setExpForm((p) => ({ ...p, [field]: Number(e.target.value) || 0 }))}
                      className="bg-transparent text-white text-sm w-full outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Total: <span className="text-red-400 font-bold">${(expForm.labor + expForm.utilities + expForm.maintenance + expForm.software + expForm.lease + expForm.equipment).toLocaleString()}</span></span>
              <button onClick={saveExpenses} disabled={saving}
                className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                {saving ? "Saving…" : "Save Expenses"}
              </button>
            </div>
          </div>

          {/* Revenue Entry */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-bold">Log Revenue</h2>
                <p className="text-gray-500 text-xs mt-0.5">{currentMonth} · updates charts below</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(["memberships", "one_off", "retail"] as const).map((field) => (
                <div key={field}>
                  <label className="text-gray-400 text-xs capitalize mb-1 block">{field.replace("_", " ")}</label>
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus-within:border-blue-500">
                    <span className="text-gray-500 text-sm mr-1">$</span>
                    <input
                      type="number" min={0}
                      value={revForm[field] || ""}
                      onChange={(e) => setRevForm((p) => ({ ...p, [field]: Number(e.target.value) || 0 }))}
                      className="bg-transparent text-white text-sm w-full outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Total: <span className="text-green-400 font-bold">${(revForm.memberships + revForm.one_off + revForm.retail).toLocaleString()}</span></span>
              <button onClick={saveRevenue} disabled={saving}
                className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                {saving ? "Saving…" : "Save Revenue"}
              </button>
            </div>
          </div>
        </div>

        {saveMsg && (
          <div className="mb-6 bg-green-950/30 border border-green-500/30 rounded-xl px-4 py-3 text-green-300 text-sm">
            {saveMsg}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Monthly Revenue", value: `$${latest.Revenue.toLocaleString()}`, sub: `+${revenueGrowth}% vs last month`, color: "text-green-400", icon: TrendingUp },
            { label: "Monthly Expenses", value: `$${latest.Expenses.toLocaleString()}`, sub: "All operating costs", color: "text-red-400", icon: TrendingDown },
            { label: "Net Profit", value: `$${latest.Profit.toLocaleString()}`, sub: `${profitMargin}% margin`, color: "text-blue-400", icon: DollarSign },
            { label: "YTD Revenue", value: `$${revenue.reduce((a, b) => a + b.total, 0).toLocaleString()}`, sub: "Since Sept 2025", color: "text-purple-400", icon: PieChart },
          ].map((k) => (
            <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <k.icon className={`h-5 w-5 ${k.color} mb-2`} />
              <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
              <p className="text-white text-sm font-medium mt-1">{k.label}</p>
              <p className="text-gray-500 text-xs">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-1">Revenue vs. Expenses vs. Profit</h2>
          <p className="text-gray-400 text-sm mb-6">Monthly comparison</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={combined}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} formatter={(v: number | undefined) => [`$${(v ?? 0).toLocaleString()}`, ""]} />
              <Legend wrapperStyle={{ color: "#9ca3af" }} />
              <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Pie */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold mb-1">Revenue Breakdown (March)</h2>
            <p className="text-gray-400 text-sm mb-4">By source</p>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <RechartsPie>
                  <Pie data={revBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {revBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px" }} formatter={(v: number | undefined) => `$${(v ?? 0).toLocaleString()}`} />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {revBreakdown.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i] }} />
                      <span className="text-gray-300 text-sm">{item.name}</span>
                    </div>
                    <span className="text-white font-semibold text-sm">${item.value.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-gray-700 pt-2 flex justify-between">
                  <span className="text-gray-400 text-sm">Total</span>
                  <span className="text-green-400 font-bold">${revBreakdown.reduce((a, b) => a + b.value, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Pie */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold mb-1">Expense Breakdown (March)</h2>
            <p className="text-gray-400 text-sm mb-4">By category</p>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <RechartsPie>
                  <Pie data={expBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {expBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i + 1]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px" }} formatter={(v: number | undefined) => `$${(v ?? 0).toLocaleString()}`} />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {expBreakdown.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i + 1] }} />
                      <span className="text-gray-300 text-sm">{item.name}</span>
                    </div>
                    <span className="text-white font-semibold text-sm">${item.value.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-gray-700 pt-2 flex justify-between">
                  <span className="text-gray-400 text-sm">Total</span>
                  <span className="text-red-400 font-bold">${expBreakdown.reduce((a, b) => a + b.value, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Trend */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-1">Profit Trend</h2>
          <p className="text-gray-400 text-sm mb-6">Net profit growing month-over-month</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={combined}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} formatter={(v: number | undefined) => [`$${(v ?? 0).toLocaleString()}`, ""]} />
              <Line type="monotone" dataKey="Profit" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-white font-bold text-lg">Monthly Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3">Month</th>
                  <th className="text-right px-6 py-3">Memberships</th>
                  <th className="text-right px-6 py-3">One-off</th>
                  <th className="text-right px-6 py-3">Retail</th>
                  <th className="text-right px-6 py-3">Total Rev</th>
                  <th className="text-right px-6 py-3">Expenses</th>
                  <th className="text-right px-6 py-3">Net Profit</th>
                  <th className="text-right px-6 py-3">Margin</th>
                </tr>
              </thead>
              <tbody>
                {revenue.map((r, i) => {
                  const exp = expenses[i];
                  const profit = r.total - (exp?.total ?? 0);
                  const margin = r.total ? ((profit / r.total) * 100).toFixed(0) : "0";
                  const isLatest = i === revenue.length - 1;
                  return (
                    <tr key={r.month} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${isLatest ? "bg-blue-950/10" : ""}`}>
                      <td className="px-6 py-3.5 text-white font-medium">{r.month} {isLatest && <span className="text-blue-400 text-xs ml-1">(current)</span>}</td>
                      <td className="px-6 py-3.5 text-right text-gray-300">${r.memberships.toLocaleString()}</td>
                      <td className="px-6 py-3.5 text-right text-gray-300">${r.one_off.toLocaleString()}</td>
                      <td className="px-6 py-3.5 text-right text-gray-300">${r.retail.toLocaleString()}</td>
                      <td className="px-6 py-3.5 text-right text-green-400 font-semibold">${r.total.toLocaleString()}</td>
                      <td className="px-6 py-3.5 text-right text-red-400">${(exp?.total ?? 0).toLocaleString()}</td>
                      <td className="px-6 py-3.5 text-right text-blue-400 font-bold">${profit.toLocaleString()}</td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={`font-semibold ${Number(margin) >= 50 ? "text-green-400" : Number(margin) >= 40 ? "text-yellow-400" : "text-orange-400"}`}>
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
