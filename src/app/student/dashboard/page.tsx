"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Service } from "@/types";

const STUDENT_ROLE = "STUDENT" as const;

export default function StudentDashboard() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesRef = collection(db, "services");
        const q = query(servicesRef);
        const querySnapshot = await getDocs(q);
        const servicesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[];
        setServices(servicesData);
      } catch (err) {
        console.error("Error fetching services:", err);
        setError("Failed to load available services.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleAvailService = async (serviceId: string) => {
    // In a real app, this would involve a payment flow and updating student's assignedServices
    alert(`Service ${serviceId} requested! (Simulated)`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div >
    );
  }

  return (
    <ProtectedRoute allowedRoles={[STUDENT]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Student Dashboard" />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Available Services</h2>
            <p className="text-gray-600">Browse and avail services that meet your needs.</p>
          </div>

          {error && <Alert variant="error" className="mb-6">{error}</Alert>}

          {services.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500">No services available at the moment.</p>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card key={service.id} className="flex flex-col">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 capitalize">
                        {service.providerType}
                      </span>
                      <span className="text-lg font-bold text-blue-600">${service.price}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">{service.description}</p>
                  </div>
                  <Button 
                    className="mt-6 w-full" 
                    variant="primary" 
                    onClick={() => handleAvailService(service.id)}
                  >
                    Avail Service
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}