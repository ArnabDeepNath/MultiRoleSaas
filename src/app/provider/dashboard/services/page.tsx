"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { LocationSelector } from "@/components/ui/LocationSelector";
import { EMPTY_LOCATION, formatLocation, LocationValue } from "@/lib/location";
import { omitUndefinedFields } from "@/lib/utils";
import { ProviderType, Service, ServiceProviderProfile } from "@/types";
import {
  createService,
  deleteService,
  getServicesByProvider,
  updateService,
} from "@/lib/services/services";
import { Pencil, Trash2 } from "lucide-react";

const PROVIDER_ROLE = "SERVICE_PROVIDER";
const PROVIDER_TYPES: { value: ProviderType; label: string }[] = [
  { value: "TEACHER", label: "Teacher / Tutor" },
  { value: "INSTITUTION", label: "School / Institution" },
  { value: "TRANSPORTER", label: "Transporter" },
];

export default function ProviderServicesPage() {
  const { user } = useAuth();
  const profileType = (user as ServiceProviderProfile | null)?.providerType;
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<ProviderType>("TEACHER");
  const [subject, setSubject] = useState("");
  const [school, setSchool] = useState("");
  const [board, setBoard] = useState("");
  const [hobby, setHobby] = useState("");
  const [otherMaster, setOtherMaster] = useState("");
  const [route, setRoute] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [location, setLocation] = useState<LocationValue>({ ...EMPTY_LOCATION });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setError(null);
        setServices(await getServicesByProvider(user.uid));
        if (profileType && PROVIDER_TYPES.some((item) => item.value === profileType)) {
          setType(profileType as ProviderType);
        }
      } catch (err) {
        console.error("Error fetching services:", err);
        setError("Failed to load your services.");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [user, profileType]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setType(profileType && PROVIDER_TYPES.some((item) => item.value === profileType) ? profileType as ProviderType : "TEACHER");
    setSubject("");
    setSchool("");
    setBoard("");
    setHobby("");
    setOtherMaster("");
    setRoute("");
    setVehicleType("");
    setLocation({ ...EMPTY_LOCATION });
    setEditingId(null);
  };

  const handleEdit = (service: Service) => {
    setName(service.name);
    setDescription(service.description);
    setPrice(service.price.toString());
    setType((service.providerType as ProviderType) || "TEACHER");
    setSubject(service.subject || "");
    setSchool(service.school || "");
    setBoard(service.board || "");
    setHobby(service.hobby || "");
    setOtherMaster(service.otherMaster || "");
    setRoute(service.route || "");
    setVehicleType(service.vehicleType || "");
    setLocation({
      state: service.state || "",
      district: service.district || "",
      address: service.address || "",
    });
    setEditingId(service.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteService(serviceId);
      setServices(services.filter((service) => service.id !== serviceId));
    } catch (err) {
      console.error("Error deleting service:", err);
      setError("Failed to delete service.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const previousLocation = editingId
        ? services.find((service) => service.id === editingId)?.location
        : undefined;
      const serviceData = omitUndefinedFields({
        name,
        description,
        price: parseFloat(price),
        providerType: type,
        subject: type === "TEACHER" ? subject || undefined : undefined,
        school: type !== "TRANSPORTER" ? school || undefined : undefined,
        board: type === "INSTITUTION" ? board || undefined : undefined,
        hobby: type !== "TRANSPORTER" ? hobby || undefined : undefined,
        otherMaster: type === "INSTITUTION" ? otherMaster || undefined : undefined,
        route: type === "TRANSPORTER" ? route || undefined : undefined,
        vehicleType: type === "TRANSPORTER" ? vehicleType || undefined : undefined,
        ...location,
        lat: user.lat,
        lng: user.lng,
        location: [location.district, location.state].filter(Boolean).join(", ") || previousLocation || "",
      });

      if (editingId) {
        await updateService(editingId, serviceData);
        setServices(services.map((service) => service.id === editingId ? { ...service, ...serviceData } : service));
      } else {
        const created = await createService(user.uid, serviceData);
        setServices([created, ...services]);
      }

      resetForm();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving service:", err);
      setError("Failed to save service. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}><div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div></ProtectedRoute>;
  }

  return (
    <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
      <DashboardLayout title="My Services">
        <div className="max-w-6xl mx-auto">
          {error && <Alert variant="error" className="mb-4">{error}</Alert>}
          {success && <Alert variant="success" className="mb-4">Service saved successfully!</Alert>}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card title={editingId ? "Edit Service" : "Add New Service"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Select
                    label="Service Type"
                    value={type}
                    onChange={(event) => setType(event.target.value as ProviderType)}
                    options={PROVIDER_TYPES}
                  />
                  <Input label="Service Name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Math Tutor" />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <textarea
                      required
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Describe your service..."
                      rows={3}
                      className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4cca] resize-none"
                    />
                  </div>
                  <Input label="Price (₹)" type="number" min="0" required value={price} onChange={(event) => setPrice(event.target.value)} placeholder="e.g. 500" />

                  {type === "TEACHER" && (
                    <Input label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Mathematics" />
                  )}
                  {type !== "TRANSPORTER" && (
                    <>
                      <Input
                        label={type === "INSTITUTION" ? "Institution / School Name" : "School"}
                        value={school}
                        onChange={(event) => setSchool(event.target.value)}
                        placeholder="e.g. City Prep School"
                      />
                      <Input label="Hobby" value={hobby} onChange={(event) => setHobby(event.target.value)} placeholder="e.g. Music, Chess" />
                    </>
                  )}
                  {type === "INSTITUTION" && (
                    <>
                      <Select
                        label="Board (School)"
                        value={board}
                        onChange={(event) => setBoard(event.target.value)}
                        options={[
                          { value: "", label: "Select board" },
                          ...["CBSE", "ICSE", "State Board", "IB", "Other"].map((value) => ({ value, label: value })),
                        ]}
                      />
                      <Input
                        label="Other Master Field"
                        value={otherMaster}
                        onChange={(event) => setOtherMaster(event.target.value)}
                        placeholder="e.g. Day Boarding, Sports Academy"
                      />
                    </>
                  )}
                  {type === "TRANSPORTER" && (
                    <>
                      <Input label="Route" required value={route} onChange={(event) => setRoute(event.target.value)} placeholder="e.g. Airport → City Prep School" />
                      <Input label="Vehicle Type" value={vehicleType} onChange={(event) => setVehicleType(event.target.value)} placeholder="e.g. Bus, Van" />
                    </>
                  )}

                  <LocationSelector value={location} onChange={setLocation} className="md:grid-cols-1" />
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" isLoading={isSubmitting}>{editingId ? "Update" : "Add"}</Button>
                    {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
                  </div>
                </form>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Active Services</h2>
              {services.length === 0 ? (
                <Card><p className="text-center text-slate-500">You have not added any services yet.</p></Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {services.map((service) => (
                    <Card key={service.id}>
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-semibold text-slate-900">{service.name}</h3>
                          <span className="text-[#3b4cca] font-bold whitespace-nowrap">₹{service.price}</span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{service.description}</p>
                        {service.route && <p className="text-sm font-medium text-amber-700">Route: {service.route}</p>}
                        <p className="text-xs text-slate-500">{formatLocation(service)}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[service.subject, service.board, service.hobby, service.otherMaster, service.vehicleType]
                            .filter((value): value is string => Boolean(value))
                            .map((value) => <span key={value} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{value}</span>)}
                        </div>
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Type: {service.providerType}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(service)} className="h-8 w-8" aria-label={`Edit ${service.name}`}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)} className="h-8 w-8 text-red-600 hover:bg-red-50" aria-label={`Delete ${service.name}`}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
