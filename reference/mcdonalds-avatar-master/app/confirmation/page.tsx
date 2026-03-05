'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  const [countdown, setCountdown] = useState(30);

  // Auto-redirect after 30 seconds
  useEffect(() => {
    if (countdown === 0) {
      router.push('/order');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

  if (!orderNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardBody>
            <div className="text-center py-8">
              <span className="text-6xl mb-4 block">⚠️</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No Order Found</h2>
              <p className="text-gray-600 mb-6">We couldn't find your order information.</p>
              <Link href="/order" className="btn-primary inline-block">
                Start New Order
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mcd-red to-mcd-dark-red flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">Thank you for your order</p>
          </div>
        </CardHeader>

        <CardBody>
          {/* Order Number */}
          <div className="bg-mcd-yellow/20 border-2 border-mcd-yellow rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 text-center mb-2">Your Order Number</p>
            <p className="text-5xl font-bold text-mcd-red text-center tracking-wider">
              {orderNumber}
            </p>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-mcd-red rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">⏱️</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Estimated Time</p>
                  <p className="text-sm text-gray-600">Your order will be ready soon</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-mcd-red">~10 min</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-mcd-red rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">📍</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Pickup Location</p>
                  <p className="text-sm text-gray-600">Counter #1</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-mcd-red rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">💳</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Payment</p>
                  <p className="text-sm text-gray-600">Pay at pickup counter</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <span className="text-blue-600 text-xl flex-shrink-0">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">What's next?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Wait for your order number to be called</li>
                  <li>Pick up your order at Counter #1</li>
                  <li>Complete payment at the counter</li>
                  <li>Enjoy your meal!</li>
                </ul>
              </div>
            </div>
          </div>
        </CardBody>

        <CardFooter>
          <div className="space-y-3">
            <Link href="/order" className="block">
              <Button variant="primary" className="w-full">
                Start New Order
              </Button>
            </Link>
            <p className="text-xs text-gray-500 text-center">
              Redirecting to order page in {countdown} seconds...
            </p>
          </div>
        </CardFooter>
      </Card>

      {/* Confetti Effect (Optional) */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <span className="text-2xl">{['🎉', '🍔', '🍟', '🥤'][Math.floor(Math.random() * 4)]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
