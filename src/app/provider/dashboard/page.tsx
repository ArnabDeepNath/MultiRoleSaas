"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Plus, Briefcase, Settings, LogOut } from "lucide-react";

const PROVIDER_ROLE = "SERVICE_PROVIDER";

export default function ProviderDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Provider Dashboard" />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.displayName}!</h2>
            <p className="text-gray-600">Manage your services and profile.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="flex flex-col items-center text-center p-6">
              <div className="mb-4 rounded-full bg-blue-100 p-3 text-blue-600">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">My Services</h3>
              <p className="mt-2 text-sm text-gray-500">View and manage the services you offer.</p>
              <Button asChild className="mt-6 w-full" variant="outline">
                <Link href="/provider/dashboard/services">Manage Services</Link>
              </Button>
            </Card>

            <Card className="flex flex-col items-center text-center p-6">
              <div className="mb-4 rounded-full bg-purple-100 p-3 text-purple-600">
                <Settings className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Profile Settings</h3>
              <p className="mt-2 text-sm text-gray-500">Update your bio and service type.</p>
              <Button asChild className="mt-6 w-full" variant="outline">
                <Link href="/provider/dashboard/profile">Edit Profile</Link>
              </Button>
            </Card>

            <Card className="flex flex-col items-center text-center p-6">
              <div className="mb-4 rounded-full bg-gray-100 p-3 text-gray-600">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Quick Actions</h3>
              <p className="mt-2 text-sm text-gray-500">Easily access common tasks.</p>
              <Button className="mt-6 w-full">View Analytics</Button>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}