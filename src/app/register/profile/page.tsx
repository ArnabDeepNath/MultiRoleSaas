"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { LocationSelector } from "@/components/ui/LocationSelector";
import { updateUserProfile } from "@/lib/auth-utils";
import { ensureProviderWallet } from "@/lib/services/leads";
import { parseCoordinate } from "@/lib/geo";
import { UserProfile } from "@/types";
import { User, Phone, Building2, GraduationCap, Bus, LocateFixed } from "lucide-react";

export default function ProfileSetupPage() {
  const { firebaseUser, role, refreshUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | undefined>();
  const [formData, setFormData] = useState({
    displayName: firebaseUser?.displayName || "",
    phoneNumber: "",
    address: "",
    district: "",
    state: "",
    country: "India",
    pincode: "",
    lat: "",
    lng: "",
    grade: "",
    school: "",
    board: "CBSE",
    bio: "",
    institutionName: "",
    vehicleType: "",
    vehicleNumber: "",
    licenseNumber: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser. Enter latitude and longitude manually.");
      return;
    }

    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        }));
        setLocationAccuracy(position.coords.accuracy);
        setIsLocating(false);
      },
      () => {
        setError("Unable to capture your location. Allow location access or enter coordinates manually.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      setError("You must be logged in to complete profile setup");
      return;
    }

    const lat = parseCoordinate(formData.lat, -90, 90);
    const lng = parseCoordinate(formData.lng, -180, 180);
    if (lat === null || lng === null) {
      setError("Valid latitude and longitude are required to complete registration.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updateData: Partial<UserProfile> & Record<string, unknown> = {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.district,
        district: formData.district,
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode,
        lat,
        lng,
        locationCapturedAt: Date.now(),
      };
      if (locationAccuracy !== undefined) updateData.locationAccuracy = locationAccuracy;

      if (role === "STUDENT") {
        updateData.grade = formData.grade;
        updateData.school = formData.school;
        updateData.board = formData.board;
      } else if (role === "SERVICE_PROVIDER") {
        updateData.bio = formData.bio;
        updateData.institutionName = formData.institutionName;
        updateData.vehicleType = formData.vehicleType;
        updateData.vehicleNumber = formData.vehicleNumber;
        updateData.licenseNumber = formData.licenseNumber;
      }

      await updateUserProfile(firebaseUser.uid, updateData);
      if (role === "SERVICE_PROVIDER") await ensureProviderWallet(firebaseUser.uid);
      await refreshUser();
      router.push("/");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3b4cca] to-[#5a6fd6] mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Complete Your Profile</h1>
          <p className="mt-2 text-slate-600">Tell us a bit more about yourself</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#3b4cca]"></div>
            <div className="h-0.5 w-8 bg-[#3b4cca]"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-[#3b4cca]"></div>
            <div className="h-0.5 w-8 bg-[#3b4cca]"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-[#3b4cca]"></div>
          </div>
        </div>

        <Card className="w-full">
          {error && <Alert variant="error" className="mb-6">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Full Name"
                value={formData.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
                placeholder="Your full name"
                icon={<User className="h-4 w-4" />}
              />
              <Input
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                placeholder="+91 98765 43210"
                icon={<Phone className="h-4 w-4" />}
              />
            </div>

            <LocationSelector
              value={{
                state: formData.state,
                district: formData.district,
                address: formData.address,
              }}
              onChange={(location) =>
                setFormData((prev) => ({ ...prev, ...location }))
              }
              className="md:grid-cols-2"
            />

            <Input
              label="Pincode"
              inputMode="numeric"
              value={formData.pincode}
              onChange={(e) => handleChange("pincode", e.target.value)}
              placeholder="Pincode"
            />

            <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Registration Geolocation</h3>
                  <p className="text-xs text-slate-600">Required for nearby services and the 5 km lead generator.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleCaptureLocation} isLoading={isLocating}>
                  <LocateFixed className="mr-2 h-4 w-4" /> Use my current location
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Latitude"
                  required
                  inputMode="decimal"
                  value={formData.lat}
                  onChange={(e) => handleChange("lat", e.target.value)}
                  placeholder="e.g. 26.144500"
                />
                <Input
                  label="Longitude"
                  required
                  inputMode="decimal"
                  value={formData.lng}
                  onChange={(e) => handleChange("lng", e.target.value)}
                  placeholder="e.g. 91.736200"
                />
              </div>
              {locationAccuracy !== undefined && <p className="text-xs text-emerald-700">Location captured with approximately {Math.round(locationAccuracy)} m accuracy.</p>}
            </div>

            {role === "STUDENT" && (
              <div className="space-y-5 p-5 bg-blue-50/50 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-[#3b4cca]" /> Student Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input
                    label="Grade / Class"
                    value={formData.grade}
                    onChange={(e) => handleChange("grade", e.target.value)}
                    placeholder="e.g. Grade 5"
                  />
                  <Input
                    label="School Name"
                    value={formData.school}
                    onChange={(e) => handleChange("school", e.target.value)}
                    placeholder="School name"
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Board</label>
                    <select
                      value={formData.board}
                      onChange={(e) => handleChange("board", e.target.value)}
                      className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4cca]"
                    >
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="State Board">State Board</option>
                      <option value="IB">IB</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {role === "SERVICE_PROVIDER" && (
              <div className="space-y-5 p-5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" /> Provider Information
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Institution / Organization Name"
                    value={formData.institutionName}
                    onChange={(e) => handleChange("institutionName", e.target.value)}
                    placeholder="Your institution or business name"
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Bio / Description</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleChange("bio", e.target.value)}
                      placeholder="Tell us about your services..."
                      rows={3}
                      className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4cca] resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input
                      label="Vehicle Type"
                      value={formData.vehicleType}
                      onChange={(e) => handleChange("vehicleType", e.target.value)}
                      placeholder="e.g. School Bus"
                      icon={<Bus className="h-4 w-4" />}
                    />
                    <Input
                      label="Vehicle Number"
                      value={formData.vehicleNumber}
                      onChange={(e) => handleChange("vehicleNumber", e.target.value)}
                      placeholder="e.g. AS-01-AB-1234"
                    />
                    <Input
                      label="License Number"
                      value={formData.licenseNumber}
                      onChange={(e) => handleChange("licenseNumber", e.target.value)}
                      placeholder="License number"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/register/subscription")}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" isLoading={isLoading} size="lg">
                Complete Setup
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
