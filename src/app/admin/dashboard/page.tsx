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
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AppSettings } from "@/types";

const ADMIN_ROLE = "SUPER_ADMIN";

export default function AdminDashboard() {
  const { user, role } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [newFee, setNewFee] = useState<string>("");
  const [newProviderTypes, setNewProviderTypes] = useState<string>("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "app_settings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as AppSettings;
          setSettings(data);
          setNewFee(data.registrationFee.toString());
          setNewProviderTypes(data.allowedServiceProviderTypes.join(", "));
        } else {
          // Initialize default settings if they don't exist
          const defaultSettings: AppSettings = {
            registrationFee: 100,
            allowedServiceProviderTypes: ["driver", "teacher"],
            maintenanceMode: false,
          };
          await setDoc(docRef, defaultSettings);
          setSettings(defaultSettings);
          setNewFee("100");
          setNewProviderTypes("driver, teacher");
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Failed to fetch application settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const fee = parseFloat(newFee);
      if (isNaN(fee)) throw new Error("Invalid registration fee.");

      const providerTypes = newProviderTypes
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const updatedSettings: AppSettings = {
        registrationFee: fee,
        allowedServiceProviderTypes: providerTypes,
        maintenanceMode: settings?.maintenanceMode || false,
      };

      await setDoc(doc(db, "settings", "app_settings"), updatedSettings);
      setSettings(updatedSettings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ADMIN_ROLE]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Super Admin Dashboard" />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>

            {error && <Alert variant="error">{error}</Alert>}
            {success && <Alert variant="success">Settings updated successfully!</Alert>}

            <Card>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Registration Fee ($)
                  </label>
                  <Input
                    type="number"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Allowed Service Provider Types (comma separated)
                  </label>
                  <Input
                    type="text"
                    value={newProviderTypes}
                    onChange={(e) => setNewProviderTypes(e.target.value)}
                    placeholder="e.g. driver, teacher, tutor"
                  />
                  <p className="text-xs text-gray-500">
                    Enter types separated by commas. These will be available for providers to select during registration.
                  </p>
                </div>

                <Button className="w-full" onClick={handleSaveSettings} isLoading={isSaving}>
                  Save Settings
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4">Current Configuration</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Registration Fee:</span>
                  <span className="font-medium">${settings?.registrationFee}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Provider Types:</span>
                  <span className="font-medium text-right">
                    {settings?.allowedServiceProviderTypes.join(", ") || "None"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}