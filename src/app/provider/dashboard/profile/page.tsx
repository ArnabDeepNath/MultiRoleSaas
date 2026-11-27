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
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ServiceProviderProfile } from "@/types";
import { parseCoordinate } from "@/lib/geo";
import { syncLeadRegistration } from "@/lib/services/leads";
import { LocateFixed } from "lucide-react";

const PROVIDER_ROLE = "SERVICE_PROVIDER";

export default function ProviderProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ServiceProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [bio, setBio] = useState("");
  const [providerType, setProviderType] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as ServiceProviderProfile;
          setProfile(data);
          setBio(data.bio || "");
          setProviderType(data.providerType || "");
           setPhoneNumber(data.phoneNumber || "");
           setLat(data.lat?.toString() || "");
           setLng(data.lng?.toString() || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is unavailable. Enter coordinates manually.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setIsLocating(false);
      },
      () => {
        setError("Unable to capture location. Enter coordinates manually.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    setIsUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      const parsedLat = parseCoordinate(lat, -90, 90);
      const parsedLng = parseCoordinate(lng, -180, 180);
      if (parsedLat === null || parsedLng === null) {
        throw new Error("Valid latitude and longitude are required for nearby leads.");
      }
      const updatedData: Partial<ServiceProviderProfile> = {
        bio,
        providerType,
        phoneNumber,
        lat: parsedLat,
        lng: parsedLng,
        locationCapturedAt: Date.now(),
        updatedAt: Date.now(),
      };

      await updateDoc(doc(db, "users", user!.uid), updatedData);
      await syncLeadRegistration({ ...profile, ...updatedData } as ServiceProviderProfile);
      setProfile({ ...profile, ...updatedData } as ServiceProviderProfile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md text-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Profile Incomplete</h2>
              <p className="text-sm text-gray-600">Please complete your profile to continue.</p>
              <Alert variant="error">Profile information is missing.</Alert>
            </div>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Edit Profile" />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>

            {error && <Alert variant="error">{error}</Alert>}
            {success && <Alert variant="success">Profile updated successfully!</Alert>}

            <Card>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Service Type
                  </label>
                  <Input
                    type="text"
                    value={providerType}
                    onChange={(e) => setProviderType(e.target.value)}
                    placeholder="e.g. Driver, Teacher"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>

                <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-gray-700">Lead Generator Location</label>
                    <Button type="button" size="sm" variant="outline" onClick={handleCaptureLocation} isLoading={isLocating}>
                      <LocateFixed className="mr-2 h-4 w-4" /> Capture
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Latitude" required inputMode="decimal" value={lat} onChange={(event) => setLat(event.target.value)} />
                    <Input label="Longitude" required inputMode="decimal" value={lng} onChange={(event) => setLng(event.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <Button className="w-full" onClick={handleUpdateProfile} isLoading={isUpdating}>
                  Update Profile
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4">Profile Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{profile.displayName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium">{profile.email}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Provider Type:</span>
                  <span className="font-medium capitalize">{profile.providerType}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium">{profile.phoneNumber || "Not provided"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Rating:</span>
                  <span className="font-medium">{profile.rating || 0} / 5</span>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
