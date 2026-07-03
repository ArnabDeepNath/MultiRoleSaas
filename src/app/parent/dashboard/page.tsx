"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { StudentProfile } from "@/types";

const PARENT_ROLE = "PARENT" as const;

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const parentData = docSnap.data();
          const childrenIds = parentData.children || [];
          
          if (childrenIds.length > 0) {
            const childrenProfiles: StudentProfile[] = [];
            for (const childId of childrenIds) {
              const childDocRef = doc(db, "users", childId);
              const childDocSnap = await getDoc(childDocRef);
              if (childDocSnap.exists()) {
                childrenProfiles.push(childDocSnap.data() as StudentProfile);
              }
            }
            setChildren(childrenProfiles);
          }
        }
      } catch (err) {
        console.error("Error fetching children:", err);
        setError("Failed to load children information.");
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div >
    );
  }

  return (
    <ProtectedRoute allowedRoles={[PARENT_ROLE]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Parent Dashboard" />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">My Children</h2>
            <p className="text-gray-600">Track your children's activities and services.</p>
          </div>

          {error && <Alert variant="error" className="mb-6">{error}</Alert>}

          {children.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500">No children linked to your account.</p>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {children.map((child) => (
                <Card key={child.uid} className="flex flex-col">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Student
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{child.displayName}</h3>
                    <p className="mt-2 text-sm text-gray-600">Email: {child.email}</p>
                    
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Active Services
                      </h4>
                      {child.assignedServices && child.assignedServices.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {child.assignedServices.map((sId, idx) => (
                            <li key={idx} className="text-sm text-gray-700">• Service ID: {sId}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500 italic">No active services.</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}