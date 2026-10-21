import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setToken, getToken } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setStudent(null);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const payload = JSON.parse(atob(token.split(".")[1]));
    api
      .getStudent(payload.sub)
      .then((data) => setStudent(data.student))
      .catch(() => {
        setToken(null);
        setStudent(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persistSession = useCallback((data) => {
    setToken(data.token);
    setStudent(data.student);
  }, []);

  const signup = useCallback(
    async (name, email, password) => {
      const data = await api.signup(name, email, password);
      persistSession(data);
      return data.student;
    },
    [persistSession]
  );

  const login = useCallback(
    async (email, password) => {
      const data = await api.login(email, password);
      persistSession(data);
      return data.student;
    },
    [persistSession]
  );

  const refreshStudent = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const data = await api.getStudent(payload.sub);
    setStudent(data.student);
    return data.student;
  }, []);

  return (
    <AuthContext.Provider value={{ student, loading, login, signup, logout, refreshStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
