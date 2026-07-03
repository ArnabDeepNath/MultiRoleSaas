"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function HomePage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && user) {
      if (role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
      } else if (role === "SERVICE_PROVIDER") {
        router.push("/provider/dashboard");
      } else if (role === "STUDENT") {
        router.push("/student/dashboard");
      } else if (role === "PARENT") {
        router.push("/parent/dashboard");
      }
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Welcome back, {user.displayName}!</h1>
        <p className="mt-4 text-lg text-gray-600">Redirecting you to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-8 sm:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            All-in-one Platform for Services
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Connecting Service Providers, Students, and Parents in one seamless ecosystem. 
            Manage, avail, and track services with ease.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Tailored for you</h2>
            <p className="mt-2 text-base leading-7 text-gray-600">
              Roles designed to meet your specific needs.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">Super Admin</dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Full control over platform settings, registration fees, and service provider types.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">Service Providers</dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Offer your expertise as a teacher, driver, or any other professional service.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">Students & Parents</dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Students avail services, while parents can track their children's activities in real-time.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}