"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Diamond, Calendar, Lock, BarChart2, Users, ChevronRight, Star, Trophy } from "lucide-react";
import { membershipTiers } from "@/lib/mockData";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay } },
});

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 overflow-hidden">

      {/* Hero */}
      <section className="relative py-28 px-6">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-purple-600/8 rounded-full blur-2xl" />
          <div className="absolute top-[30%] right-[10%] w-48 h-48 bg-blue-400/8 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div {...fadeUp(0)} className="flex justify-center mb-6">
            <div className="bg-blue-600/15 border border-blue-500/25 rounded-full px-5 py-2 text-blue-300 text-sm font-medium flex items-center gap-2">
              <Diamond className="h-4 w-4" />
              Built for Indoor Baseball Facilities
            </div>
          </motion.div>

          <motion.h1 {...fadeUp(0.1)} className="text-6xl sm:text-8xl font-black tracking-tight text-white mb-6 leading-none">
            Diamond<span className="text-blue-400">Base</span>
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one platform for cage bookings, team memberships, smart access control, and player performance — built for serious indoor facilities.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25">
              Book a Cage <ChevronRight className="h-5 w-5" />
            </Link>
            <Link href="/leagues"
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" /> HitTrax League
            </Link>
          </motion.div>

          {/* Live stats bar */}
          <motion.div {...fadeUp(0.4)} className="mt-14 inline-flex flex-wrap justify-center gap-8 bg-gray-900/60 border border-gray-800 rounded-2xl px-8 py-5 backdrop-blur-sm">
            {[
              { label: "Active Members", value: "91" },
              { label: "Cages", value: "4" },
              { label: "Sessions This Month", value: "386" },
              { label: "League Teams", value: "4" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-blue-400">{s.value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <motion.h2 {...fadeUp(0)} className="text-3xl font-bold text-center text-white mb-3">
          Everything a facility needs
        </motion.h2>
        <motion.p {...fadeUp(0.05)} className="text-gray-500 text-center mb-12">
          One platform. Every operation.
        </motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Calendar, title: "Smart Scheduling", desc: "Real-time availability, credit-based bookings, and guardrails to prevent calendar hoarding.", color: "text-blue-400", bg: "bg-blue-500/10", border: "hover:border-blue-500/40" },
            { icon: Lock, title: "Access Control", desc: "Auto-generated time-sensitive PINs. The door unlocks 15 minutes before your session starts.", color: "text-green-400", bg: "bg-green-500/10", border: "hover:border-green-500/40" },
            { icon: BarChart2, title: "HitTrax Stats", desc: "Sync exit velocity, launch angle, and hard-hit% directly from HitTrax into player profiles.", color: "text-purple-400", bg: "bg-purple-500/10", border: "hover:border-purple-500/40" },
            { icon: Trophy, title: "HitTrax League", desc: "5-week competitive seasons with standings, schedules, and all-time player records.", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "hover:border-yellow-500/40" },
          ].map((f, i) => (
            <motion.div key={f.title} {...fadeUp(i * 0.07)}
              className={`bg-gray-900 border border-gray-800 ${f.border} rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1`}>
              <div className={`${f.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className={`h-6 w-6 ${f.color}`} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Individual Memberships */}
      <section className="py-20 px-6 bg-gray-900/40 border-y border-gray-800/60">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-2">Individual Memberships</h2>
          <p className="text-gray-500 text-center mb-12">Monthly credits — no rollover.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {membershipTiers.individual.map((tier, i) => (
              <motion.div key={tier.name} {...fadeUp(i * 0.1)}
                className={`relative bg-gray-900 border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${i === 2 ? "border-blue-500 ring-1 ring-blue-500 shadow-lg shadow-blue-500/10" : "border-gray-800 hover:border-gray-600"}`}>
                {i === 2 && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Star className="h-3 w-3" /> MOST POPULAR
                  </div>
                )}
                <div className={`inline-block bg-gradient-to-r ${tier.color} text-white text-sm font-bold px-3 py-1 rounded-full mb-5`}>
                  {tier.name}
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-black text-white">${tier.price}</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-gray-300 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/login?mode=signup&tier=${tier.name}&type=individual`}
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] ${i === 2 ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30" : "bg-gray-800 hover:bg-gray-700 text-white"}`}>
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Memberships */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-2">Team Memberships</h2>
          <p className="text-gray-500 text-center mb-12">45-min turf + 2 cages per session.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {membershipTiers.team.map((tier, i) => (
              <motion.div key={tier.name} {...fadeUp(i * 0.1)}
                className={`bg-gray-900 border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${i === 2 ? "border-blue-500 ring-1 ring-blue-500 shadow-lg shadow-blue-500/10" : "border-gray-800 hover:border-gray-600"}`}>
                <div className={`inline-block bg-gradient-to-r ${tier.color} text-white text-sm font-bold px-3 py-1 rounded-full mb-5`}>
                  Team {tier.name}
                </div>
                <div className="mb-2">
                  <span className="text-5xl font-black text-white">${tier.price}</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <p className="text-blue-300 text-sm font-semibold mb-5">{tier.sessions} session{tier.sessions > 1 ? "s" : ""}/month</p>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-gray-300 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/login?mode=signup&tier=${tier.name}&type=team`}
                  className="block text-center py-3 rounded-xl font-semibold text-sm bg-gray-800 hover:bg-gray-700 text-white transition-all hover:scale-[1.02]">
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <Diamond className="h-14 w-14 text-blue-400 mx-auto mb-5" />
          <h2 className="text-4xl font-bold text-white mb-4">Run your facility smarter.</h2>
          <p className="text-gray-400 mb-8 text-lg">DiamondBase handles the operations so you can focus on the game.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admin"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/25 inline-flex items-center justify-center gap-2">
              View Admin Dashboard <ChevronRight className="h-5 w-5" />
            </Link>
            <Link href="/leagues"
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-[1.02] inline-flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" /> Explore the League
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
