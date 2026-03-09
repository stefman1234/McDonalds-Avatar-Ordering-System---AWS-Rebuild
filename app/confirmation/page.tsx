"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const orderType = searchParams.get("type");
  const [countdown, setCountdown] = useState(30);

  // Auto-return to idle after 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.push("/");
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-8">
      {/* Success Icon */}
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-fade-in">
        <svg
          className="w-14 h-14 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-fade-in">
        Order Confirmed!
      </h1>

      <p className="text-gray-500 text-lg mb-2">Your order number is</p>

      <div className="bg-mcdonalds-yellow text-gray-900 rounded-3xl mb-4 shadow-xl px-10 py-6 flex flex-col items-center">
        <span className="text-[5rem] font-black leading-none tracking-tight">
          #{orderId ?? "---"}
        </span>
        <span className="text-sm font-semibold text-gray-700 mt-1 uppercase tracking-widest">
          Order Number
        </span>
      </div>

      {orderType && (
        <p className="text-gray-600 font-medium mb-4">
          {orderType === "dine_in" ? "🍽 Dine In" : "🥡 Takeout"}
        </p>
      )}

      <p className="text-gray-400 text-sm mb-8 max-w-sm">
        Your order is being prepared. Please wait for your number to be called.
      </p>

      <button
        onClick={() => router.push("/")}
        className="btn-secondary text-lg"
      >
        Start New Order
      </button>

      <p className="text-gray-300 text-xs mt-8">
        Returning to home in {countdown}s
      </p>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-mcdonalds-red border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
