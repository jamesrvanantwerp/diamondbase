"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Lock, Star, AlertTriangle, CheckCircle, Clock, Zap, Trash2, Target, Trophy, TrendingUp } from "lucide-react";
import { useBookings } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { sessionTrend } from "@/lib/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const myStats = { avgEV: 94.2, maxEV: 108.1, avgLA: 12.4, hardHitPct: 52 };
const mySessions = [
  { date: "Feb 28, 2026", cage: "HitTrax Cage – 60 min", avgEV: 94.2, maxEV: 108.1, avgLA: 12.4, hardHitPct: 52 },
  { date: "Feb 22, 2026", cage: "HitTrax Cage – 60 min", avgEV: 92.8, maxEV: 105.3, avgLA: 13.1, hardHitPct: 49 },
  { date: "Feb 15, 2026", cage: "Cage #1 – 30 min", avgEV: 91.5, maxEV: 103.0, avgLA: 11.8, hardHitPct: 47 },
  { date: "Feb 8, 2026", cage: "HitTrax Cage – 60 min", avgEV: 90.3, maxEV: 101.2, avgLA: 10.9, hardHitPct: 44 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35 } }),
};

export default function DashboardPage() {
  const { bookings, loading, cancelBooking } = useBookings();
  const { user, member: authMember, loading: authLoading, refreshMember } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const member = {
    name: authMember?.name ?? "Member",
    tier: authMember?.tier ?? "Silver",
    creditsUsed: authMember?.credits_used ?? 0,
    creditsTotal: authMember?.credits_total ?? 2,
    memberSince: authMember?.member_since ? new Date(authMember.member_since).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—",
  };

  const creditsLeft = Math.max(0, member.creditsTotal - member.creditsUsed);
  const atCap = bookings.length >= 3;

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}
          className="flex items-start justify-between mb-8">
          <div>
            <p className="text-gray-400 text-sm mb-1">Welcome back,</p>
            <h1 className="text-3xl font-bold text-white">{member.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3" /> {member.tier} Member
              </span>
              <span className="text-gray-500 text-sm">Since {member.memberSince}</span>
            </div>
          </div>
          <Link href="/book"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            + Book a Cage
          </Link>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Monthly Credits",
              content: (
                <div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-3xl font-black text-white">{creditsLeft}</span>
                    <span className="text-gray-500 text-sm mb-1">/ {member.creditsTotal} remaining</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${(creditsLeft / member.creditsTotal) * 100}%` }} />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Resets Mar 31 · Use-it-or-lose-it</p>
                </div>
              ),
            },
            {
              label: "Active Bookings",
              content: (
                <div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-3xl font-black text-white">{bookings.length}</span>
                    <span className="text-gray-500 text-sm mb-1">/ 3 max</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-700 ${atCap ? "bg-orange-500" : "bg-blue-500"}`}
                      style={{ width: `${Math.min((bookings.length / 3) * 100, 100)}%` }} />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    {atCap ? "Cap reached — cancel to book new" : `${3 - bookings.length} slot${3 - bookings.length !== 1 ? "s" : ""} available`}
                  </p>
                </div>
              ),
            },
            {
              label: "Today's Status",
              content: (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-white font-semibold">Available</p>
                    <p className="text-gray-500 text-xs">1 slot per day limit</p>
                  </div>
                </div>
              ),
            },
          ].map((card, i) => (
            <motion.div key={card.label} initial="hidden" animate="show" variants={fadeUp} custom={i + 1}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-gray-400 text-sm mb-1">{card.label}</p>
              {card.content}
            </motion.div>
          ))}
        </div>

        {/* Bookings List */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={4}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold text-lg">Upcoming Sessions</h2>
            <Link href="/book" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
              + Add booking
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="h-10 w-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No upcoming bookings.</p>
              <Link href="/book" className="mt-3 inline-block text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Book your first session →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <motion.div key={b.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
                  className="flex items-center justify-between bg-gray-800/50 rounded-xl p-4 group">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600/20 rounded-lg p-2.5">
                      <Calendar className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{b.cage_type}</p>
                      <p className="text-gray-400 text-sm">{b.date} at {b.time}</p>
                      <p className="text-gray-600 text-xs">{b.payment_method}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 bg-gray-700 rounded-lg px-3 py-1.5">
                        <Lock className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-white font-mono font-bold text-sm tracking-widest">{b.pin}</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1 text-center">Access PIN</p>
                    </div>
                    <button
                      onClick={() => {
                        const bookingTime = new Date(`${b.date} ${b.time}`);
                        const hoursUntil = (bookingTime.getTime() - Date.now()) / (1000 * 60 * 60);
                        const refund = hoursUntil >= 48;
                        const msg = refund
                          ? "Cancel this booking? Your credit will be refunded."
                          : "Cancel this booking? Less than 48 hours notice — your credit will NOT be refunded.";
                        if (confirm(msg)) { cancelBooking(b.id); refreshMember(); }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10"
                      title="Cancel booking"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Alerts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {atCap && (
            <motion.div initial="hidden" animate="show" variants={fadeUp} custom={5}
              className="bg-yellow-950/20 border border-yellow-500/20 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-300 font-semibold text-sm">Booking Cap Reached</p>
                  <p className="text-gray-400 text-xs mt-1">You have {bookings.length} active bookings (max 3). Cancel one to add a new slot.</p>
                </div>
              </div>
            </motion.div>
          )}
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={6}
            className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-300 font-semibold text-sm">HitTrax Session Synced</p>
                <p className="text-gray-400 text-xs mt-1">Your Mar 2 session data is available. Avg EV: 94.2 mph</p>
                <Link href="/stats" className="text-blue-400 text-xs hover:underline">View stats →</Link>
              </div>
            </div>
          </motion.div>
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={7}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:col-span-2">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-300 font-medium text-sm">No-Show Policy</p>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Check in via your access PIN or facility iPad within <strong className="text-gray-300">15 minutes</strong> of your booking start.
                  No-shows result in a forfeited credit and a <strong className="text-gray-300">$15 fee</strong> charged to your card on file.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Personal HitTrax Stats */}
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={8} className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-yellow-400" />
            <h2 className="text-white font-bold text-lg">My HitTrax Stats</h2>
            <span className="text-gray-500 text-xs ml-1">Mock data · HitTrax sync coming soon</span>
          </div>

          {/* Personal stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Avg Exit Velocity", value: `${myStats.avgEV}`, unit: "mph", color: "text-blue-400", icon: Zap },
              { label: "Personal Best EV", value: `${myStats.maxEV}`, unit: "mph", color: "text-yellow-400", icon: Trophy },
              { label: "Avg Launch Angle", value: `${myStats.avgLA}`, unit: "°", color: "text-green-400", icon: Target },
              { label: "Hard Hit %", value: `${myStats.hardHitPct}`, unit: "%", color: "text-purple-400", icon: TrendingUp },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                <p className={`text-2xl font-black ${s.color}`}>{s.value}<span className="text-base font-semibold ml-0.5">{s.unit}</span></p>
                <p className="text-white text-sm font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* EV Trend Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-1">Exit Velocity Trend</h3>
            <p className="text-gray-400 text-sm mb-5">Your average EV over the last 8 weeks</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sessionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="week" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis domain={[84, 96]} tick={{ fill: "#6b7280", fontSize: 11 }} unit=" mph" />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }}
                  labelStyle={{ color: "#9ca3af" }}
                />
                <Line type="monotone" dataKey="ev" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 4 }} name="Avg EV" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Sessions */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-semibold">Recent Sessions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="text-left px-6 py-3">Session</th>
                    <th className="text-right px-6 py-3">Avg EV</th>
                    <th className="text-right px-6 py-3">Max EV</th>
                    <th className="text-right px-6 py-3">Avg LA</th>
                    <th className="text-right px-6 py-3">Hard Hit%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {mySessions.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-3 text-gray-400">{s.date}</td>
                      <td className="px-6 py-3 text-white font-medium">{s.cage}</td>
                      <td className="px-6 py-3 text-right text-blue-400 font-bold">{s.avgEV} mph</td>
                      <td className="px-6 py-3 text-right text-gray-300">{s.maxEV} mph</td>
                      <td className="px-6 py-3 text-right text-gray-300">{s.avgLA}°</td>
                      <td className="px-6 py-3 text-right">
                        <span className={`font-semibold ${s.hardHitPct >= 48 ? "text-green-400" : s.hardHitPct >= 40 ? "text-yellow-400" : "text-gray-300"}`}>
                          {s.hardHitPct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
