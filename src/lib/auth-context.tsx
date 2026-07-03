"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile, UserRole } from "@/types";

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  role: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          setFirebaseUser(fbUser);
          const userDoc = await getDoc(doc(db, "users", fbUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            setUser(userData);
            setRole(userData.role);
          } else {
            // If no profile exists, we might be in a registration flow
            setUser(null);
            setRole(null);
          }
        } else {
          setFirebaseUser(null);
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);