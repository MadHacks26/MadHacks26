import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type UserCredential,
} from "firebase/auth";
import { auth } from "./lib/firebase";

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

type AuthContextValue = AuthState & {
  isConfigured: boolean;
  login: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  clearError: () => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  React.useEffect(() => {
    if (!auth) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState((s) => ({ ...s, user, loading: false, error: null }));
    });
    return () => unsubscribe();
  }, []);

  const login = React.useCallback(async () => {
    if (!auth) throw new Error("Firebase Auth is not configured");
    setState((s) => ({ ...s, error: null }));
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      return cred;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Sign in failed";
      setState((s) => ({ ...s, error: message }));
      throw e;
    }
  }, []);

  const logout = React.useCallback(async () => {
    if (!auth) return;
    await clearAllLocalStorage();
    await firebaseSignOut(auth);
    setState((s) => ({ ...s, user: null, error: null }));
  }, []);

  const getIdToken = React.useCallback(async (): Promise<string | null> => {
    if (!auth?.currentUser) return null;
    return auth.currentUser.getIdToken();
  }, []);

  // Function to delete all local storage items and call it on logout
  const clearAllLocalStorage = React.useCallback(() => {
    localStorage.clear();
  }, []);

  const clearError = React.useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const value: AuthContextValue = {
    ...state,
    isConfigured: !!auth,
    login,
    logout,
    getIdToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
