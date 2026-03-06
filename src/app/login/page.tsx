"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Diamond, Mail, Lock, User, AlertCircle, Loader2, ChevronLeft, Star, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { membershipTiers } from "@/lib/mockData";

const CREDITS_MAP: Record<string, number | null> = {
  "Silver-individual": 2, "Gold-individual": 4, "Platinum-individual": null,
  "Silver-team": 1, "Gold-team": 2, "Platinum-team": 4,
};

const TIER_COLORS: Record<string, string> = {
  Silver: "from-gray-400 to-gray-500",
  Gold: "from-yellow-400 to-yellow-600",
  Platinum: "from-blue-400 to-purple-600",
};

function LoginContent() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const defaultTier = searchParams.get("tier") ?? "Silver";
  const defaultType = (searchParams.get("type") === "team" ? "team" : "individual") as "individual" | "team";

  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedTier, setSelectedTier] = useState(defaultTier);
  const [membershipType, setMembershipType] = useState<"individual" | "team">(defaultType);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const switchMode = (m: "signin" | "signup") => {
    setMode(m); setError(null); setSuccessMsg(null); setSignupStep(1);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await signIn(email, password);
    if (err) { setError(err); setLoading(false); }
    else router.push("/dashboard");
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    setError(null);
    setSignupStep(2);
  };

  const handleSignUp = async () => {
    setError(null);
    setLoading(true);
    const err = await signUp(email, password, name, selectedTier, membershipType);
    if (err) { setError(err); }
    else setSuccessMsg("Account created! Check your email to confirm, then sign in.");
    setLoading(false);
  };

  const tiers = membershipType === "individual" ? membershipTiers.individual : membershipTiers.team;
  const creditsKey = `${selectedTier}-${membershipType}`;
  const creditsValue = CREDITS_MAP[creditsKey];
  const creditsLabel = creditsValue === null ? "Unlimited" : `${creditsValue} credit${creditsValue !== 1 ? "s" : ""}`;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Diamond className="h-8 w-8 text-blue-400" />
            <span className="text-white font-black text-2xl tracking-tight">
              Diamond<span className="text-blue-400">Base</span>
            </span>
          </div>
          <p className="text-gray-400 text-sm">Indoor baseball facility management</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-gray-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => switchMode("signin")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "signin" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "signup" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2 text-red-300 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-950/30 border border-green-500/30 rounded-xl p-3 mb-4 text-green-300 text-sm">
              {successMsg}
            </div>
          )}

          {/* ── SIGN IN ── */}
          {mode === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign In
              </button>
            </form>
          )}

          {/* ── SIGN UP STEP 1: credentials ── */}
          {mode === "signup" && signupStep === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Jake Martinez" required
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" minLength={6} required
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <p className="text-gray-600 text-xs mt-1">Minimum 6 characters</p>
              </div>
              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors mt-2">
                Next: Choose Membership →
              </button>
            </form>
          )}

          {/* ── SIGN UP STEP 2: membership selection ── */}
          {mode === "signup" && signupStep === 2 && (
            <div>
              <button onClick={() => setSignupStep(1)}
                className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-5 transition-colors">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>

              <p className="text-white font-semibold mb-3">Choose your membership</p>

              {/* Individual / Team toggle */}
              <div className="flex gap-1 bg-gray-800 rounded-xl p-1 mb-5">
                <button onClick={() => setMembershipType("individual")}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${membershipType === "individual" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                  Individual
                </button>
                <button onClick={() => setMembershipType("team")}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${membershipType === "team" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                  Team
                </button>
              </div>

              {/* Tier cards */}
              <div className="space-y-3 mb-6">
                {tiers.map((tier, i) => {
                  const isSelected = selectedTier === tier.name;
                  const key = `${tier.name}-${membershipType}`;
                  const cv = CREDITS_MAP[key];
                  const cl = cv === null ? "Unlimited" : `${cv} credit${cv !== 1 ? "s" : ""}/mo`;
                  const isPopular = membershipType === "individual" && i === 2;
                  return (
                    <button key={tier.name} onClick={() => setSelectedTier(tier.name)}
                      className={`w-full text-left p-4 rounded-xl border transition-colors ${isSelected ? "border-blue-500 bg-blue-950/30" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${isSelected ? "border-blue-500 bg-blue-500" : "border-gray-500"}`}>
                            {isSelected && <Check className="h-2 w-2 text-white" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-block bg-gradient-to-r ${TIER_COLORS[tier.name]} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                                {membershipType === "team" ? "Team " : ""}{tier.name}
                              </span>
                              {isPopular && (
                                <span className="flex items-center gap-0.5 text-yellow-400 text-xs font-semibold">
                                  <Star className="h-3 w-3" /> Popular
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-xs mt-0.5">{cl}</p>
                          </div>
                        </div>
                        <span className="text-white font-bold">${tier.price}<span className="text-gray-500 text-xs font-normal">/mo</span></span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Summary + submit */}
              <div className="bg-gray-800/50 rounded-xl p-4 mb-4 flex justify-between items-center text-sm">
                <div>
                  <p className="text-white font-medium">
                    {membershipType === "team" ? "Team " : ""}{selectedTier} Membership
                  </p>
                  <p className="text-gray-400 text-xs">{creditsLabel} per month</p>
                </div>
                <span className="text-blue-400 font-black text-xl">
                  ${tiers.find(t => t.name === selectedTier)?.price ?? 0}
                  <span className="text-gray-500 text-xs font-normal">/mo</span>
                </span>
              </div>

              <button onClick={handleSignUp} disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Account
              </button>
            </div>
          )}

          {/* Demo login — sign-in only */}
          {mode === "signin" && !successMsg && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-gray-500 text-xs text-center mb-2">Just here to explore?</p>
              <button
                onClick={() => { setEmail("demo@diamondbase.com"); setPassword("demo1234"); }}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                Fill Demo Credentials
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
