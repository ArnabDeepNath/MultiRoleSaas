"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { Service, ServiceProviderProfile } from "@/types";

const PROVIDER_ROLE = "SERVICE_PROVIDER";

export default function ProviderServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      if (!user) return;
      try {
        const servicesRef = collection(db, "services");
        const q = query(servicesRef, where("providerId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const servicesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[];
        setServices(servicesData);
      } catch (err) {
        console.error("Error fetching services:", err);
        setError("Failed to load your services.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [user]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsAdding(true);
    setError(null);
    setSuccess(false);

    try {
      const newService: Omit<Service, "id"> = {
        providerId: user.uid,
        name,
        description,
        price: parseFloat(price),
        providerType: type,
      };

      await addDoc(collection(db, "services"), newService);
      
      // Reset form
      setName("");
      setDescription("");
      setPrice("");
      setType("");
      
      // Refresh list
      const servicesRef = collection(db, "services");
      const q = query(servicesRef, where("providerId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      setServices(servicesData);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error adding service:", err);
      setError("Failed to add service. Please check your inputs.");
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div >
    );
  }

  return (
    <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar title="My Services" />
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card>
                <h3 className="text-lg font-semibold mb-4">Add New Service</h3>
                {error && <Alert variant="error" className="mb-4">{error}</Alert>}
                {success && <Alert variant="success" className="mb-4">Service added!</Alert>}
                
                <form onSubmit={handleAddService} className="space-y-4">
                  <Input
                    label="Service Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Math Tutor"
                  />
                  <Input
                    label="Description"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your service..."
                  />
                  <Input
                    label="Price ($)"
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 50"
                  />
                  <Input
                    label="Service Type"
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="e.g. Teacher"
                  />
                  <Button type="submit" className="w-full" isLoading={isAdding}>
                    Add Service
                  </Button>
                </form>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Active Services</h2>
              {services.length === 0 ? (
                <Card>
                  <p className="text-center text-gray-500">You haven't added any services yet.</p>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {services.map((service) => (
                    <Card key={service.id}>
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                          <span className="text-blue-600 font-bold">${service.price}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                        <div className="pt-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Type: {service.providerType}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}