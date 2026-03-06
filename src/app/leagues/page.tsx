"use client";
import React, { useState, useEffect } from "react";
import { Trophy, Users, UserPlus, Calendar, CheckCircle, ChevronDown, ChevronUp, Zap, Target, TrendingUp } from "lucide-react";
import { leagueSchedule, leaguePlayerStats, teamHistoricalStats, freeAgents, hittraxStats, sessionTrend } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Tab = "facility" | "standings" | "schedule" | "players" | "teams" | "register";
type Season = { id: string; label: string; dates: string; status: string; current_week: number };
type Team = { id: string; name: string; season_id: string; wins: number; losses: number; runs_for: number; runs_against: number; members: string[] };

export default function LeaguesPage() {
  const [tab, setTab] = useState<Tab>("facility");
  const [selectedSeason, setSelectedSeason] = useState("s3");
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [registerType, setRegisterType] = useState<"team" | "freeagent">("team");
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from("league_seasons").select("*").order("created_at"),
        supabase.from("league_teams").select("*").order("wins", { ascending: false }),
      ]);
      if (s) setSeasons(s);
      if (t) setTeams(t);
      setDbLoading(false);
    };
    fetch();
  }, []);
  const [registered, setRegistered] = useState(false);
  const [isMember, setIsMember] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [playerNames, setPlayerNames] = useState(["", "", "", ""]);

  const season = seasons.find((s) => s.id === selectedSeason) ?? { id: "s3", label: "Season 3", dates: "", status: "active", current_week: 1 };
  const seasonTeams = teams.filter((t) => t.season_id === selectedSeason).sort((a, b) => b.wins - a.wins || (b.runs_for - b.runs_against) - (a.runs_for - a.runs_against));
  const seasonSchedule = leagueSchedule.filter((g) => g.season === selectedSeason);
  const topPlayer = hittraxStats[0];

  const tabs: { id: Tab; label: string }[] = [
    { id: "facility", label: "Facility Stats" },
    { id: "standings", label: "Standings" },
    { id: "schedule", label: "Schedule" },
    { id: "players", label: "Player Stats" },
    { id: "teams", label: "Team History" },
    { id: "register", label: "Register" },
  ];

  const isLeagueTab = tab !== "facility";

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Zap className="h-8 w-8 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">HitTrax</h1>
          {isLeagueTab && (
            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full border border-green-500/30">
              Season 3 Active
            </span>
          )}
        </div>
        {isLeagueTab ? (
          <>
            <p className="text-gray-400 mb-2 ml-11">5-week competitive seasons · 4 players per team · HitTrax-powered stats</p>
            <div className="ml-11 flex items-center gap-4 mb-8 text-sm">
              <span className="text-gray-300">Members: <span className="text-blue-400 font-semibold">$70/season</span></span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-300">Non-members: <span className="text-gray-300 font-semibold">$90/season</span></span>
            </div>
          </>
        ) : (
          <p className="text-gray-400 mb-8 ml-11">Live performance data synced from HitTrax sessions at DiamondBase.</p>
        )}

        {/* Season Selector — only for league tabs */}
        {isLeagueTab && (
          <div className="flex items-center gap-3 mb-6">
            <span className="text-gray-400 text-sm">Season:</span>
            <div className="flex gap-2">
              {seasons.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSeason(s.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedSeason === s.id ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {s.label}
                  {s.status === "active" && <span className="ml-1.5 w-1.5 h-1.5 bg-green-400 rounded-full inline-block"></span>}
                </button>
              ))}
            </div>
            <span className="text-gray-500 text-sm">{season.dates}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-8 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                tab === t.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── FACILITY STATS ── */}
        {tab === "facility" && (
          <div>
            {/* Top stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Facility Leader EV", value: `${topPlayer.avgEV} mph`, sub: topPlayer.name, color: "text-yellow-400", icon: Trophy },
                { label: "Max Exit Velocity", value: `${topPlayer.maxEV} mph`, sub: "All-time facility record", color: "text-blue-400", icon: Zap },
                { label: "Avg Launch Angle", value: `${topPlayer.avgLA}°`, sub: "Facility average", color: "text-green-400", icon: Target },
                { label: "Total Sessions", value: "96", sub: "This month", color: "text-purple-400", icon: TrendingUp },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-white text-sm font-medium mt-1">{s.label}</p>
                  <p className="text-gray-500 text-xs">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* EV Trend Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
              <h2 className="text-white font-bold text-lg mb-1">Exit Velocity Trend – Jake M.</h2>
              <p className="text-gray-400 text-sm mb-6">Average exit velocity over 8 weeks of sessions</p>
              <ResponsiveContainer width="100%" height={220}>
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

            {/* Leaderboard */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-white font-bold text-lg">Member Leaderboard</h2>
                <p className="text-gray-400 text-sm">Ranked by average exit velocity</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                      <th className="text-left px-6 py-3">Rank</th>
                      <th className="text-left px-6 py-3">Player</th>
                      <th className="text-right px-6 py-3">Avg EV</th>
                      <th className="text-right px-6 py-3">Max EV</th>
                      <th className="text-right px-6 py-3">Avg LA</th>
                      <th className="text-right px-6 py-3">Hard Hit%</th>
                      <th className="text-right px-6 py-3">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hittraxStats.map((player, i) => (
                      <tr key={player.name} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${i === 0 ? "bg-yellow-950/10" : ""}`}>
                        <td className="px-6 py-4">
                          {i === 0 ? (
                            <span className="text-yellow-400 font-bold flex items-center gap-1"><Trophy className="h-4 w-4" /> 1</span>
                          ) : (
                            <span className="text-gray-400 font-medium">{i + 1}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                              {player.avatar}
                            </div>
                            <span className="text-white font-medium">{player.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-blue-400 font-bold">{player.avgEV}</span>
                          <span className="text-gray-500 text-xs"> mph</span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-300">{player.maxEV} mph</td>
                        <td className="px-6 py-4 text-right text-gray-300">{player.avgLA}°</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-semibold ${player.hardHitPct >= 48 ? "text-green-400" : player.hardHitPct >= 40 ? "text-yellow-400" : "text-gray-300"}`}>
                            {player.hardHitPct}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-400">{player.sessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-800 text-center">
                <p className="text-gray-500 text-xs">Data synced via HitTrax Commercial API · Updated in real-time</p>
              </div>
            </div>
          </div>
        )}

        {/* STANDINGS */}
        {tab === "standings" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">{season.label} Standings</h2>
              {season.status === "active" && (
                <span className="text-gray-400 text-sm">Week {season.current_week} of 5</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                    <th className="text-left px-6 py-3">Rank</th>
                    <th className="text-left px-6 py-3">Team</th>
                    <th className="text-center px-4 py-3">W</th>
                    <th className="text-center px-4 py-3">L</th>
                    <th className="text-center px-4 py-3">RF</th>
                    <th className="text-center px-4 py-3">RA</th>
                    <th className="text-center px-4 py-3">Diff</th>
                    <th className="text-center px-4 py-3">Streak</th>
                    <th className="text-left px-4 py-3">Roster</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonTeams.map((team, i) => (
                    <React.Fragment key={team.id}>
                      <tr
                        className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer ${i === 0 && season.status === "completed" ? "bg-yellow-950/10" : ""}`}
                        onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                      >
                        <td className="px-6 py-4">
                          {i === 0 && season.status === "completed" ? (
                            <Trophy className="h-5 w-5 text-yellow-400" />
                          ) : (
                            <span className="text-gray-400 font-medium">{i + 1}</span>
                          )}
                        </td>
                        <td className="px-6 py-4"><span className="text-white font-semibold">{team.name}</span></td>
                        <td className="px-4 py-4 text-center text-green-400 font-bold">{team.wins}</td>
                        <td className="px-4 py-4 text-center text-red-400 font-bold">{team.losses}</td>
                        <td className="px-4 py-4 text-center text-gray-300">{team.runs_for}</td>
                        <td className="px-4 py-4 text-center text-gray-300">{team.runs_against}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={team.runs_for - team.runs_against >= 0 ? "text-green-400" : "text-red-400"}>
                            {team.runs_for - team.runs_against > 0 ? "+" : ""}{team.runs_for - team.runs_against}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">—</span>
                        </td>
                        <td className="px-4 py-4">
                          <button className="text-gray-400 hover:text-white transition-colors">
                            {expandedTeam === team.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>
                      {expandedTeam === team.id && (
                        <tr className="bg-gray-800/30 border-b border-gray-800">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-gray-400 text-sm">Roster:</span>
                              {team.members.map((m) => (
                                <span key={m} className="bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs px-2.5 py-1 rounded-full">{m}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SCHEDULE */}
        {tab === "schedule" && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((week) => {
              const games = seasonSchedule.filter((g) => g.week === week);
              return (
                <div key={week} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between">
                    <span className="text-white font-semibold">Week {week}</span>
                    {week === season.current_week && season.status === "active" && (
                      <span className="bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full">Current Week</span>
                    )}
                  </div>
                  <div className="divide-y divide-gray-800">
                    {games.map((g, i) => (
                      <div key={i} className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-white font-medium w-36">{g.home}</span>
                          <span className="text-gray-500 text-sm">vs</span>
                          <span className="text-white font-medium w-36">{g.away}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {g.status === "final" ? (
                            <div className="text-right">
                              <span className="text-green-400 font-bold text-lg">{g.homeScore}</span>
                              <span className="text-gray-500 mx-2">–</span>
                              <span className="text-green-400 font-bold text-lg">{g.awayScore}</span>
                              <span className="ml-3 text-xs font-semibold bg-gray-700 text-gray-400 px-2 py-0.5 rounded">FINAL</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-400 text-sm">{g.date}</span>
                              <span className="text-xs font-semibold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">UPCOMING</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PLAYER STATS */}
        {tab === "players" && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: "League Leader EV", value: `${leaguePlayerStats[0].avgEV} mph`, sub: leaguePlayerStats[0].name },
                { label: "Most Runs Scored", value: leaguePlayerStats[2].runsScored.toString(), sub: leaguePlayerStats[2].name },
                { label: "Top Hard Hit%", value: `${leaguePlayerStats[0].hardHitPct}%`, sub: leaguePlayerStats[0].name },
                { label: "Champions", value: leaguePlayerStats[2].name, sub: "Season 1 · The Yard Dogs" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <p className="text-xl font-black text-blue-400">{s.value}</p>
                  <p className="text-white text-sm font-medium">{s.label}</p>
                  <p className="text-gray-500 text-xs">{s.sub}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-800">
                <h2 className="text-white font-bold">All-Time Player Stats</h2>
                <p className="text-gray-400 text-sm">Cumulative across all league seasons</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                      <th className="text-left px-5 py-3">Player</th>
                      <th className="text-left px-5 py-3">Team</th>
                      <th className="text-right px-5 py-3">Seasons</th>
                      <th className="text-right px-5 py-3">GP</th>
                      <th className="text-right px-5 py-3">Avg EV</th>
                      <th className="text-right px-5 py-3">Max EV</th>
                      <th className="text-right px-5 py-3">Runs</th>
                      <th className="text-right px-5 py-3">Hard Hit%</th>
                      <th className="text-right px-5 py-3">Titles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaguePlayerStats.sort((a, b) => b.avgEV - a.avgEV).map((p, i) => (
                      <tr key={p.name} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {i === 0 && <Trophy className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />}
                            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{p.avatar}</div>
                            <span className="text-white font-medium text-sm">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-sm">{p.team}</td>
                        <td className="px-5 py-3.5 text-right text-gray-300 text-sm">{p.seasons}</td>
                        <td className="px-5 py-3.5 text-right text-gray-300 text-sm">{p.gamesPlayed}</td>
                        <td className="px-5 py-3.5 text-right text-blue-400 font-bold text-sm">{p.avgEV}</td>
                        <td className="px-5 py-3.5 text-right text-gray-300 text-sm">{p.maxEV}</td>
                        <td className="px-5 py-3.5 text-right text-green-400 font-semibold text-sm">{p.runsScored}</td>
                        <td className="px-5 py-3.5 text-right text-gray-300 text-sm">{p.hardHitPct}%</td>
                        <td className="px-5 py-3.5 text-right">
                          {p.championships > 0 ? (
                            <span className="flex items-center justify-end gap-1 text-yellow-400 font-bold text-sm"><Trophy className="h-3.5 w-3.5" /> {p.championships}</span>
                          ) : (
                            <span className="text-gray-600 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TEAM HISTORY */}
        {tab === "teams" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              {teamHistoricalStats.map((team, i) => (
                <div key={team.name} className={`bg-gray-900 border rounded-2xl p-6 ${i === 0 ? "border-gray-600" : "border-gray-800"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-lg">{team.name}</h3>
                    {team.championships > 0 && (
                      <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-3 py-1">
                        <Trophy className="h-4 w-4 text-yellow-400" />
                        <span className="text-yellow-400 text-xs font-bold">{team.championships}× Champ</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Seasons Played", value: team.seasons },
                      { label: "Championships", value: team.championships },
                      { label: "Runner-Ups", value: team.runnerUps },
                      { label: "All-Time W–L", value: `${team.totalWins}–${team.totalLosses}` },
                      { label: "Avg Runs/Game", value: team.avgRunsPerGame },
                      { label: "Best Finish", value: team.bestFinish },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-gray-800/50 rounded-xl p-3">
                        <p className="text-white font-bold">{stat.value}</p>
                        <p className="text-gray-500 text-xs">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REGISTER */}
        {tab === "register" && (
          <div className="max-w-lg">
            {registered ? (
              <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-8 text-center">
                <CheckCircle className="h-14 w-14 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">
                  {registerType === "team" ? "Team Registered!" : "You're on the List!"}
                </h2>
                <p className="text-gray-400 mb-4">
                  {registerType === "team"
                    ? "Your team has been registered for Season 3. You'll receive schedule details via email."
                    : "You've been added to the free agent pool. We'll match you with a team before the season starts."}
                </p>
                <div className="bg-gray-800 rounded-xl p-4 text-left mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Season</span>
                    <span className="text-white">Season 3 · Mar 4 – Apr 8</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Entry Fee</span>
                    <span className="text-blue-400 font-bold">{isMember ? "$70 (member rate)" : "$90 (non-member)"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Format</span>
                    <span className="text-white">4-player teams · 5 weeks</span>
                  </div>
                </div>
                <button onClick={() => setRegistered(false)} className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                  Register another team →
                </button>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-white font-bold text-xl mb-1">Register for Season 3</h2>
                <p className="text-gray-400 text-sm mb-6">Season starts March 4 · 5 weeks · 4-player teams</p>
                <div className="flex items-center gap-4 mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isMember} onChange={(e) => setIsMember(e.target.checked)} className="w-4 h-4 accent-blue-500" />
                    <span className="text-gray-300 text-sm">I am a DiamondBase member</span>
                  </label>
                </div>
                <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Season Entry Fee</span>
                    <div className="text-right">
                      <span className="text-blue-400 font-black text-2xl">{isMember ? "$70" : "$90"}</span>
                      <span className="text-gray-400 text-sm ml-1">/player</span>
                    </div>
                  </div>
                  {isMember && <p className="text-gray-500 text-xs mt-1">Member discount applied ($20 off non-member rate)</p>}
                </div>
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => setRegisterType("team")}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${registerType === "team" ? "border-blue-500 bg-blue-950/30" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"}`}
                  >
                    <Users className={`h-6 w-6 ${registerType === "team" ? "text-blue-400" : "text-gray-400"}`} />
                    <span className={`font-semibold text-sm ${registerType === "team" ? "text-white" : "text-gray-400"}`}>Register a Team</span>
                    <span className="text-gray-500 text-xs text-center">You have 4 players ready</span>
                  </button>
                  <button
                    onClick={() => setRegisterType("freeagent")}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${registerType === "freeagent" ? "border-blue-500 bg-blue-950/30" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"}`}
                  >
                    <UserPlus className={`h-6 w-6 ${registerType === "freeagent" ? "text-blue-400" : "text-gray-400"}`} />
                    <span className={`font-semibold text-sm ${registerType === "freeagent" ? "text-white" : "text-gray-400"}`}>Join as Free Agent</span>
                    <span className="text-gray-500 text-xs text-center">We'll match you with a team</span>
                  </button>
                </div>
                {registerType === "team" && (
                  <div className="space-y-3 mb-6">
                    <div>
                      <label className="text-gray-400 text-sm block mb-1.5">Team Name</label>
                      <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. Iron Bats" />
                    </div>
                    {[0, 1, 2, 3].map((n) => (
                      <div key={n}>
                        <label className="text-gray-400 text-sm block mb-1.5">Player {n + 1} {n === 0 && "(Team Captain)"}</label>
                        <input value={playerNames[n]} onChange={(e) => { const p = [...playerNames]; p[n] = e.target.value; setPlayerNames(p); }} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" placeholder="Full name or email" />
                      </div>
                    ))}
                  </div>
                )}
                {registerType === "freeagent" && (
                  <div className="space-y-3 mb-6">
                    <div>
                      <label className="text-gray-400 text-sm block mb-1.5">Your Name</label>
                      <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" placeholder="Full name" />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm block mb-1.5">Position / Notes</label>
                      <input className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. OF, SS, any" />
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                      <p className="text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-blue-400" /> Current Free Agent Pool
                      </p>
                      {freeAgents.map((fa) => (
                        <div key={fa.name} className="flex items-center justify-between py-1.5 border-b border-gray-700 last:border-0">
                          <span className="text-gray-300 text-sm">{fa.name} · {fa.position}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400 text-xs">{fa.avgEV} mph EV</span>
                            {fa.member && <span className="text-green-400 text-xs">Member</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={async () => {
                    if (registerType === "team" && teamName) {
                      const members = playerNames.filter(Boolean);
                      await supabase.from("league_teams").insert([{
                        name: teamName, season_id: "s3",
                        wins: 0, losses: 0, runs_for: 0, runs_against: 0, members,
                      }]);
                      const { data } = await supabase.from("league_teams").select("*").order("wins", { ascending: false });
                      if (data) setTeams(data);
                    }
                    setRegistered(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {registerType === "team" ? <Users className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                  {registerType === "team" ? "Register Team" : "Join Free Agent Pool"} — {isMember ? "$70" : "$90"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
