"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";

type OrderType = "dine_in" | "takeout";
type PaymentMethod = "card" | "cash" | "mobile_pay";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const tax = useCartStore((s) => s.tax);
  const total = useCartStore((s) => s.total);
  const clearCart = useCartStore((s) => s.clearCart);
  const [submitting, setSubmitting] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmOrder() {
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const orderRes = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            customizations: item.customizations,
          })),
          orderType,
        }),
      });

      if (!orderRes.ok) throw new Error("Order failed");
      const order = await orderRes.json();

      const payRes = await fetch("/api/payment/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          amount: order.total,
          method: paymentMethod,
        }),
      });

      if (!payRes.ok) {
        const payError = await payRes.json();
        throw new Error(payError.error || "Payment failed");
      }

      clearCart();
      router.push(`/confirmation?orderId=${order.orderId}&type=${orderType}`);
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-5xl">🛒</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Your cart is empty
        </h2>
        <button
          onClick={() => router.push("/order")}
          className="btn-secondary"
        >
          Back to Order
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 text-lg"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Order Type */}
        <div>
          <h3 className="text-gray-500 text-sm font-medium mb-3">
            Order Type
          </h3>
          <div className="flex gap-3">
            {(["dine_in", "takeout"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  orderType === type
                    ? "bg-mcdonalds-red text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {type === "dine_in" ? "🍽 Dine In" : "🥡 Takeout"}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <h3 className="text-gray-500 text-sm font-medium mb-3">
            Payment Method
          </h3>
          <div className="flex gap-3">
            {([
              { key: "card" as const, label: "💳 Card" },
              { key: "cash" as const, label: "💵 Cash" },
              { key: "mobile_pay" as const, label: "📱 Mobile" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPaymentMethod(key)}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  paymentMethod === key
                    ? "bg-mcdonalds-red text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h3 className="text-gray-500 text-sm font-medium mb-3">
            Order Summary
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 ${
                  idx < items.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div>
                  <p className="text-gray-900 font-medium">
                    {item.quantity}x {item.name}
                  </p>
                  {item.customizations.length > 0 && (
                    <p className="text-gray-500 text-sm">
                      {item.customizations.join(", ")}
                    </p>
                  )}
                </div>
                <span className="text-mcdonalds-red font-bold">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Total + Confirm */}
      <div className="bg-white border-t border-gray-200 px-6 pb-8 pt-4 space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax (8.25%)</span>
          <span>${tax().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>Total</span>
          <span className="text-mcdonalds-red">${total().toFixed(2)}</span>
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center py-1">{error}</p>
        )}

        <button
          onClick={handleConfirmOrder}
          disabled={submitting}
          className="w-full btn-primary text-lg py-4 mt-2 disabled:opacity-50"
        >
          {submitting
            ? "Processing Payment..."
            : `Pay $${total().toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
