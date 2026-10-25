import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const AuthContext = createContext({ user: null, roles: [], loading: true, refresh: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = useCallback(async (u) => {
    if (!u) return setRoles([]);
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
    setRoles((data || []).map((r) => r.role));
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setTimeout(() => loadRoles(u), 0);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      await loadRoles(u);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadRoles]);

  const value = {
    user,
    roles,
    loading,
    isSeller: roles.includes("seller"),
    isAdmin: roles.includes("admin"),
    refresh: () => loadRoles(user),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
