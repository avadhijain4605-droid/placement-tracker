import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, ask the server who the current session belongs to.
  // The session cookie is HttpOnly so the browser JS cannot read it;
  // the server validates it and returns the student profile (or 401).
  useEffect(() => {
    api
      .me()
      .then((data) => setStudent(data.student))
      .catch(() => {
        setStudent(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const data = await api.signup(name, email, password);
    setStudent(data.student);
    return data.student;
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    setStudent(data.student);
    return data.student;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Even if the network call fails, clear local state.
    }
    setStudent(null);
  }, []);

  const refreshStudent = useCallback(async () => {
    const data = await api.me();
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
