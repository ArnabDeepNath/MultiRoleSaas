"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { LocationSelector } from "@/components/ui/LocationSelector";
import { getAllServices, createServiceRequest } from "@/lib/services/services";
import { EMPTY_LOCATION, formatLocation, LocationValue, matchesLocation } from "@/lib/location";
import { matchesExactFilter, uniqueServiceValues } from "@/lib/service-filters";
import { Service } from "@/types";
import { Bus, MapPin } from "lucide-react";

const STUDENT_ROLE = "STUDENT";

export default function StudentTransportPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<LocationValue>({ ...EMPTY_LOCATION });
  const [route, setRoute] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const all = await getAllServices();
      setServices(all.filter((s) => s.providerType === "TRANSPORTER"));
      setLoading(false);
    };
    fetch();
  }, []);

  const routeOptions = Array.from(new Set(uniqueServiceValues(services, "route")));
  const filteredServices = services.filter((service) => matchesLocation(service, filters) && matchesExactFilter(service.route, route));
  const hasFilters = Boolean(filters.state || filters.district || filters.address.trim() || route);

  const handleRequest = async (service: Service) => {
    if (!user) return;
    setRequestingId(service.id);
    try {
      await createServiceRequest(user.uid, service);
      alert("Transport service requested.");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setRequestingId(null);
    }
  };

  if (loading) return <ProtectedRoute allowedRoles={[STUDENT_ROLE]}><div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div></ProtectedRoute>;

  return (
    <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
      <DashboardLayout title="School Transport">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">School Transport</h2>
            <p className="mt-1 text-sm text-slate-600">Select a state and district, or search by street address.</p>
          </div>

          <Card title="Location filters" description="Choose locations from the dropdown lists. Only the address is free-form.">
            <div className="space-y-4">
              <LocationSelector value={filters} onChange={setFilters} mode="filter" />
              <Select
                label="Route"
                value={route}
                onChange={(event) => setRoute(event.target.value)}
                options={[
                  { value: "", label: routeOptions.length ? "All routes" : "No routes available" },
                  ...routeOptions.map((value) => ({ value, label: value })),
                ]}
              />
              {hasFilters && (
                <Button type="button" variant="outline" size="sm" onClick={() => { setFilters({ ...EMPTY_LOCATION }); setRoute(""); }}>
                  Clear filters
                </Button>
              )}
            </div>
          </Card>

          <Card title={`Available Routes (${filteredServices.length})`}>
            {filteredServices.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                {hasFilters ? "No transport routes match the selected location." : "No transport routes available."}
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredServices.map((service) => (
                  <div key={service.id} className="p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Bus className="h-5 w-5 text-amber-600" />
                      <h3 className="font-semibold text-slate-900">{service.name}</h3>
                    </div>
                    <p className="text-sm text-slate-600">{service.description}</p>
                    {service.route && <p className="mt-2 text-sm font-medium text-amber-700">Route: {service.route}</p>}
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{formatLocation(service)}</span>
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-[#3b4cca]">₹{service.price}</span>
                      <Button size="sm" onClick={() => handleRequest(service)} isLoading={requestingId === service.id}>Request</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
