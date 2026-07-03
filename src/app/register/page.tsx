"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/auth-utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { UserRole } from "@/types";

const ROLES: { label: string; value: UserRole }[] = [
  { label: "Service Provider", value: "SERVICE_PROVIDER" },
  { label: "Student", value: "STUDENT" },
  { label: "Parent", value: "PARENT" },
];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [providerType, setProviderType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, we would handle payment here before registration
      // For this MVP, we'll assume payment is completed or simulated
      
      const profile: any = {
        email,
        displayName,
        role,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      if (role === "SERVICE_PROVIDER") {
        profile.providerType = providerType;
        profile.services = [];
      } else if (role === "PARENT") {
        profile.children = [];
      } else if (role === "STUDENT") {
        profile.assignedServices = [];
      }

      await register(email, password, profile);
      setSuccess(true);
      
      // Redirect to payment page after a delay if successful
      setTimeout(() => {
        router.push("/register/payment");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md text-center">
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Registration Successful!</h2>
            <p className="text-sm text-gray-600">Please proceed to payment to activate your account.</p>
            <Button asChild>
              <Link href="/register/payment">Proceed to Payment</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Create account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="John Doe"
          />
          <Input
            label="Email address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Register as</label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {role === "SERVICE_PROVIDER" && (
            <Input
              label="Service Type (e.g. Driver, Teacher)"
              type="text"
              required
              value={providerType}
              onChange={(e) => setProviderType(e.target.value)}
              placeholder="e.g. Driver"
            />
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Register
          </Button>
        </form>
      </Card>
    </div>
  );
}