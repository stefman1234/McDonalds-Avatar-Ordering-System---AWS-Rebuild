"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function IdlePage() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/order");
  }, [router]);

  function handleStart() {
    router.push("/order");
  }

  return (
    <div
      className="h-screen w-screen relative overflow-hidden bg-black"
      onClick={handleStart}
    >
      {/* Background Advertisement Image */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <Image
          src="/mcdonalds-ad.jpg"
          alt="McDonald's Advertisement"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Overlay gradient for better button visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

      {/* McDonald's Branding */}
      <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
        <div className="w-16 h-16 bg-mcdonalds-red rounded-full flex items-center justify-center shadow-xl">
          <span className="text-3xl font-bold text-mcdonalds-yellow">M</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            McDonald&apos;s
          </h1>
          <p className="text-sm text-white/90 drop-shadow-lg">
            AI-Powered Ordering
          </p>
        </div>
      </div>

      {/* Start Order Button */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <button
          onClick={handleStart}
          className="group relative px-16 py-8 text-3xl font-bold bg-mcdonalds-red hover:bg-[#C41E3A] text-white rounded-2xl shadow-2xl transition-all transform hover:scale-105 active:scale-95"
        >
          <span className="flex items-center gap-4">
            <span className="text-5xl">🍔</span>
            <span>Start Order</span>
            <span className="text-5xl group-hover:translate-x-2 transition-transform">
              →
            </span>
          </span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-8 left-0 right-0 text-center z-10">
        <p className="text-white text-lg font-medium drop-shadow-lg">
          Touch anywhere to begin your order
        </p>
      </div>
    </div>
  );
}
