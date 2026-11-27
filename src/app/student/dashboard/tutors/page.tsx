"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { LocationSelector } from "@/components/ui/LocationSelector";
import { getAllServices, createServiceRequest } from "@/lib/services/services";
import { EMPTY_LOCATION, formatLocation, LocationValue, matchesLocation } from "@/lib/location";
import { includesFilter, matchesExactFilter, uniqueServiceValues } from "@/lib/service-filters";
import { Service } from "@/types";
import { Building2, GraduationCap, MapPin } from "lucide-react";

const STUDENT_ROLE = "STUDENT";
type TypeFilter = "ALL" | "TEACHER" | "INSTITUTION";

export default function StudentTutorsPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<LocationValue>({ ...EMPTY_LOCATION });
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [subject, setSubject] = useState("");
  const [school, setSchool] = useState("");
  const [board, setBoard] = useState("");
  const [hobby, setHobby] = useState("");
  const [otherMaster, setOtherMaster] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const all = await getAllServices();
      setServices(all.filter((service) => service.providerType === "TEACHER" || service.providerType === "INSTITUTION"));
      setLoading(false);
    };
    fetch().catch((error) => {
      console.error("Failed to load tutors:", error);
      setLoading(false);
    });
  }, []);

  const scopedServices = useMemo(
    () => typeFilter === "ALL" ? services : services.filter((service) => service.providerType === typeFilter),
    [services, typeFilter]
  );
  const subjectOptions = useMemo(() => uniqueServiceValues(scopedServices, "subject"), [scopedServices]);
  const boardOptions = useMemo(() => uniqueServiceValues(scopedServices, "board"), [scopedServices]);
  const otherMasterOptions = useMemo(() => uniqueServiceValues(scopedServices, "otherMaster"), [scopedServices]);

  const filteredServices = useMemo(() => scopedServices.filter((service) =>
    matchesLocation(service, filters) &&
    includesFilter(service.school, school) &&
    includesFilter(service.hobby, hobby) &&
    (typeFilter !== "TEACHER" || matchesExactFilter(service.subject, subject)) &&
    (typeFilter !== "INSTITUTION" || (
      matchesExactFilter(service.board, board) && matchesExactFilter(service.otherMaster, otherMaster)
    ))
  ), [scopedServices, filters, school, hobby, typeFilter, subject, board, otherMaster]);

  const hasFilters = Boolean(filters.state || filters.district || filters.address.trim() || subject || school || board || hobby || otherMaster);

  const handleTypeChange = (value: TypeFilter) => {
    setTypeFilter(value);
    setSubject("");
    setBoard("");
    setOtherMaster("");
  };

  const clearFilters = () => {
    setFilters({ ...EMPTY_LOCATION });
    setSubject("");
    setSchool("");
    setBoard("");
    setHobby("");
    setOtherMaster("");
  };

  const handleRequest = async (service: Service) => {
    if (!user) return;
    setRequestingId(service.id);
    try {
      await createServiceRequest(user.uid, service);
      alert("Service requested.");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setRequestingId(null);
    }
  };

  if (loading) return <ProtectedRoute allowedRoles={[STUDENT_ROLE]}><div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div></ProtectedRoute>;

  return (
    <ProtectedRoute allowedRoles={[STUDENT_ROLE]}>
      <DashboardLayout title="Find Tutors & Institutions">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Find Tutors & Institutions</h2>
            <p className="mt-1 text-sm text-slate-600">Choose a provider type to see its relevant filters.</p>
          </div>

          <Card title="Dynamic filters" description="Filter options are generated from available services.">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2" aria-label="Provider type">
                {([
                  { value: "ALL", label: "All", icon: null },
                  { value: "TEACHER", label: "Teachers", icon: <GraduationCap className="h-4 w-4" /> },
                  { value: "INSTITUTION", label: "Institutions", icon: <Building2 className="h-4 w-4" /> },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleTypeChange(option.value)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${typeFilter === option.value ? "border-[#3b4cca] bg-[#3b4cca] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    {option.icon}{option.label}
                  </button>
                ))}
              </div>

              <LocationSelector value={filters} onChange={setFilters} mode="filter" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {typeFilter === "TEACHER" && (
                  <Select
                    label="Subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    options={[{ value: "", label: "All subjects" }, ...subjectOptions.map((value) => ({ value, label: value }))]}
                  />
                )}
                {typeFilter === "INSTITUTION" && (
                  <>
                    <Select
                      label="Board (School)"
                      value={board}
                      onChange={(event) => setBoard(event.target.value)}
                      options={[{ value: "", label: boardOptions.length ? "All boards" : "No boards available" }, ...boardOptions.map((value) => ({ value, label: value }))]}
                    />
                    <Select
                      label="Other Master Field"
                      value={otherMaster}
                      onChange={(event) => setOtherMaster(event.target.value)}
                      options={[{ value: "", label: otherMasterOptions.length ? "All master categories" : "No master categories available" }, ...otherMasterOptions.map((value) => ({ value, label: value }))]}
                    />
                  </>
                )}
                <Input label={typeFilter === "INSTITUTION" ? "Institution / School" : "School"} value={school} onChange={(event) => setSchool(event.target.value)} placeholder="Search by school" />
                <Input label="Hobby" value={hobby} onChange={(event) => setHobby(event.target.value)} placeholder="e.g. Music, Chess" />
              </div>
              {hasFilters && <Button type="button" variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>}
            </div>
          </Card>

          <Card title={`Available Services (${filteredServices.length})`}>
            {filteredServices.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No tutors or institutions match the selected filters.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((service) => (
                  <div key={service.id} className="p-4 rounded-xl border border-slate-200 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      {service.providerType === "INSTITUTION" ? <Building2 className="h-5 w-5 text-emerald-600" /> : <GraduationCap className="h-5 w-5 text-[#3b4cca]" />}
                      <h3 className="font-semibold text-slate-900">{service.name}</h3>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{service.description}</p>
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{formatLocation(service)}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {[service.subject, service.board, service.hobby, service.otherMaster]
                        .filter((value): value is string => Boolean(value))
                        .map((value) => <span key={value} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{value}</span>)}
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4">
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
