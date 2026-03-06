"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Member = {
  id: string;
  name: string;
  email: string;
  tier: string;
  membership_type: string;
  credits_total: number;
  credits_used: number;
  member_since: string;
  user_id: string;
};

type AuthContextType = {
  user: User | null;
  member: Member | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, name: string, tier?: string, membershipType?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshMember: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMember = async (userId: string) => {
    const [{ data: memberData }, { data: adminData }] = await Promise.all([
      supabase.from("members").select("*").eq("user_id", userId).single(),
      supabase.from("admins").select("id").eq("user_id", userId).single(),
    ]);
    if (memberData) setMember(memberData);
    setIsAdmin(!!adminData);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchMember(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMember(session.user.id).then(() => setLoading(false));
      } else {
        setMember(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh member record when credits change (e.g. after booking/cancel)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("my-member-record")
      .on("postgres_changes", { event: "*", schema: "public", table: "members", filter: `user_id=eq.${user.id}` },
        (payload) => setMember(payload.new as Member))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  };

  const signUp = async (email: string, password: string, name: string, tier = "Silver", membershipType = "individual") => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (data.user) {
      const creditsMap: Record<string, number> = {
        "Silver-individual": 2, "Gold-individual": 4, "Platinum-individual": 99,
        "Silver-team": 1, "Gold-team": 2, "Platinum-team": 4,
      };
      const credits_total = creditsMap[`${tier}-${membershipType}`] ?? 2;
      // Upsert so that if the race condition already inserted a Silver record, we overwrite it
      const { data: newMember } = await supabase.from("members").upsert([{
        user_id: data.user.id, email, name,
        tier, membership_type: membershipType,
        credits_total, credits_used: 0,
      }], { onConflict: "user_id" }).select().single();
      if (newMember) setMember(newMember);
    }
    return null;
  };

  const refreshMember = async () => {
    if (user) await fetchMember(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMember(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, member, isAdmin, loading, signIn, signUp, signOut, refreshMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
