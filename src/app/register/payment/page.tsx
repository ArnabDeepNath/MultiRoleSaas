"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function PaymentPage() {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSimulatePayment = async () => {
    if (!user) return;
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate a delay for payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real app, we would verify the payment with a provider like Stripe
      // Here we just mark the user as "paid" or simply proceed
      // For this MVP, we assume the user is now fully registered

      router.push("/login");
    } catch (err) {
      console.error("Payment error:", err);
      setError("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <div className="space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Complete Registration
            </h2>
            <p className="text-sm text-gray-600">
              To activate your account, please complete the registration fee
              payment.
            </p>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <Button
            className="w-full"
            onClick={handleSimulatePayment}
            isLoading={isProcessing}
          >
            Pay Registration Fee
          </Button>

          <p className="text-xs text-gray-400">
            This is a simulated payment for demonstration purposes.
          </p>
        </div>
      </Card>
    </div>
  );
}
