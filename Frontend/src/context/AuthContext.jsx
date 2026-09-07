import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.warn("Failed to fetch current user profile:", err);
      localStorage.removeItem("token");
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (username, password) => {
    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      const { access_token, role } = response.data;
      localStorage.setItem("token", access_token);

      // Fetch complete profile or set initial
      const profile = await fetchCurrentUser();
      if (!profile) {
        setUser({ username, role });
      }

      toast.success(`Welcome back, Agent ${username}`);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Authentication failed. Check credentials.";
      toast.error(errorMsg);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post("/auth/register", {
        username,
        email,
        password,
      });
      toast.success(response.data.message || "Officer registered successfully.");
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Registration failed.";
      toast.error(errorMsg);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (localStorage.getItem("token")) {
        await api.post("/auth/logout").catch(() => {});
      }
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      toast.success("Logged out successfully");
    }
  };

  // RBAC Permission Helpers
  const role = user?.role?.toLowerCase() || "";
  const isAdmin = role === "admin";
  const isInvestigator = role === "investigator";
  const isOfficer = role === "officer";
  const isAuditor = role === "auditor";

  const canUpload = ["admin", "investigator", "officer"].includes(role);
  const canDownload = ["admin", "investigator"].includes(role);
  const canVerify = ["admin", "investigator", "auditor"].includes(role);
  const canManageUsers = isAdmin;

  const value = {
    user,
    role,
    loading,
    login,
    register,
    logout,
    refreshUser: fetchCurrentUser,
    isAdmin,
    isInvestigator,
    isOfficer,
    isAuditor,
    canUpload,
    canDownload,
    canVerify,
    canManageUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}