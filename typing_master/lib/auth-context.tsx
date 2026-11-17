"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { API_URL } from "@/lib/api-config";

export interface MongoUser {
  _id: string;
  firebaseUid: string;
  email?: string;
  name?: string;
  photo?: string;
  role: "user" | "admin";
  isBanned?: boolean;
  country?: string;
  level: number;
  xp: number;
  streak?: {
    current: number;
    best: number;
    lastActiveDate?: string;
  };
  badges?: Array<{ _id: string; title: string; description: string; icon: string }>;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  mongoUser: MongoUser | null;
  token: string | null;
  loading: boolean;
  syncing: boolean;
  isFirebaseConfigured: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<FirebaseUser>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<FirebaseUser>;
  signInWithGoogle: () => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: { name?: string; photo?: string; country?: string }) => Promise<MongoUser | null>;
  refreshMongoUser: () => Promise<MongoUser | null>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [mongoUser, setMongoUser] = useState<MongoUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Sync user with backend MongoDB
  const syncWithBackend = useCallback(
    async (fbUser: FirebaseUser, idToken: string, extraData?: { name?: string }) => {
      setSyncing(true);
      try {
        const response = await fetch(`${API_URL}/api/auth/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            name: extraData?.name || fbUser.displayName || "",
            photo: fbUser.photoURL || "",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setMongoUser(data.user);
          return data.user as MongoUser;
        } else {
          console.warn("[auth-context] Server sync returned non-OK:", response.status);
        }
      } catch (err) {
        console.warn("[auth-context] Unable to sync with backend server:", err);
      } finally {
        setSyncing(false);
      }
      return null;
    },
    [],
  );

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const freshToken = await user.getIdToken();
      setToken(freshToken);
      return freshToken;
    } catch {
      return token;
    }
  }, [user, token]);

  const refreshMongoUser = useCallback(async (): Promise<MongoUser | null> => {
    if (!user) return null;
    try {
      const currentToken = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMongoUser(data.user);
        return data.user;
      }
    } catch (err) {
      console.warn("[auth-context] Error refreshing mongo user:", err);
    }
    return null;
  }, [user]);

  // Auth state listener & redirect handler
  useEffect(() => {
    // Process redirect sign-in result if returning from redirect flow
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const idToken = await result.user.getIdToken();
          setToken(idToken);
          await syncWithBackend(result.user, idToken);
        }
      })
      .catch((err) => {
        console.warn("[auth-context] getRedirectResult:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          setToken(idToken);
          await syncWithBackend(currentUser, idToken);
        } catch (err) {
          console.error("[auth-context] Error resolving token:", err);
        }
      } else {
        setToken(null);
        setMongoUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncWithBackend]);

  const signInWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const idToken = await cred.user.getIdToken();
    setToken(idToken);
    await syncWithBackend(cred.user, idToken);
    return cred.user;
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }
    const idToken = await cred.user.getIdToken();
    setToken(idToken);
    await syncWithBackend(cred.user, idToken, { name });
    return cred.user;
  };

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken();
      setToken(idToken);
      await syncWithBackend(cred.user, idToken);
      return cred.user;
    } catch (err: unknown) {
      const fbErr = err as { code?: string };
      if (
        fbErr?.code === "auth/popup-blocked" ||
        fbErr?.code === "auth/cancelled-popup-request"
      ) {
        console.warn("[auth] Popup blocked by browser. Using redirect instead...");
        await signInWithRedirect(auth, googleProvider);
        // Do not resolve so caller doesn't push route before browser redirects
        return new Promise<FirebaseUser>(() => {});
      }
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setMongoUser(null);
    setToken(null);
  };

  const updateUserProfile = async (updates: {
    name?: string;
    photo?: string;
    country?: string;
  }): Promise<MongoUser | null> => {
    if (!user) return null;
    const currentToken = await user.getIdToken();

    // If name was updated, also update Firebase profile
    if (updates.name && user) {
      await updateProfile(user, { displayName: updates.name }).catch(() => {});
    }

    const res = await fetch(`${API_URL}/api/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      const data = await res.json();
      setMongoUser(data.user);
      return data.user;
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${res.status}`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        mongoUser,
        token,
        loading,
        syncing,
        isFirebaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
        updateUserProfile,
        refreshMongoUser,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
