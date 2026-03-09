"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";

type OrderType = "dine_in" | "takeout";
type PaymentMethod = "card" | "cash" | "mobile_pay";
type ReceiptPref = "none" | "email" | "print";

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
  const [receiptPref, setReceiptPref] = useState<ReceiptPref>("none");
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
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <button onClick={() => router.push("/order")} className="btn-secondary">
          Back to Order
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 text-lg min-w-[44px] min-h-[44px] flex items-center"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Order Type */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Where are you eating?
          </h3>
          <div className="flex gap-3">
            {(["dine_in", "takeout"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 rounded-2xl font-semibold transition-all min-h-[80px] touch-manipulation ${
                  orderType === type
                    ? "bg-mcdonalds-red text-white shadow-md scale-[1.02]"
                    : "bg-white text-gray-600 border-2 border-gray-200 hover:border-mcdonalds-red"
                }`}
              >
                <span className="text-2xl">{type === "dine_in" ? "🍽" : "🥡"}</span>
                <span className="text-sm">{type === "dine_in" ? "Dine In" : "Takeout"}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Payment Method */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            How would you like to pay?
          </h3>
          {/* NFC/Tap — primary large button */}
          <button
            onClick={() => setPaymentMethod("card")}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl mb-3 border-2 transition-all min-h-[72px] touch-manipulation ${
              paymentMethod === "card"
                ? "border-mcdonalds-red bg-red-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              paymentMethod === "card" ? "bg-mcdonalds-red text-white" : "bg-gray-100"
            }`}>
              <span className="text-xl">💳</span>
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-gray-900">Tap to Pay / Card</p>
              <p className="text-xs text-gray-500">Visa · Mastercard · Contactless</p>
            </div>
            {paymentMethod === "card" && (
              <span className="text-mcdonalds-red font-bold text-lg">✓</span>
            )}
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => setPaymentMethod("mobile_pay")}
              className={`flex-1 flex flex-col items-center gap-1 py-4 rounded-2xl border-2 font-medium transition-all min-h-[72px] touch-manipulation ${
                paymentMethod === "mobile_pay"
                  ? "border-mcdonalds-red bg-red-50 text-mcdonalds-red"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">📱</span>
              <span className="text-sm">Mobile Pay</span>
              <span className="text-[10px] text-gray-400">Apple Pay · GrabPay</span>
            </button>
            <button
              onClick={() => setPaymentMethod("cash")}
              className={`flex-1 flex flex-col items-center gap-1 py-4 rounded-2xl border-2 font-medium transition-all min-h-[72px] touch-manipulation ${
                paymentMethod === "cash"
                  ? "border-mcdonalds-red bg-red-50 text-mcdonalds-red"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">💵</span>
              <span className="text-sm">Cash</span>
              <span className="text-[10px] text-gray-400">Pay at counter</span>
            </button>
          </div>
        </section>

        {/* Receipt Preference */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Receipt
          </h3>
          <div className="flex gap-2">
            {([
              { key: "none" as const, label: "No receipt", icon: "✕" },
              { key: "print" as const, label: "Print", icon: "🖨" },
              { key: "email" as const, label: "Email", icon: "📧" },
            ]).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setReceiptPref(key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-medium transition-all min-h-[60px] touch-manipulation ${
                  receiptPref === key
                    ? "border-mcdonalds-red bg-red-50 text-mcdonalds-red"
                    : "border-gray-200 bg-white text-gray-500"
                }`}
              >
                <span>{icon}</span>
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Order Summary */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Order Summary
          </h3>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between px-4 py-3 ${
                  idx < items.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium text-sm truncate">
                    {item.quantity > 1 && (
                      <span className="text-mcdonalds-red font-bold mr-1">{item.quantity}×</span>
                    )}
                    {item.name}
                  </p>
                  {item.customizations.length > 0 && (
                    <p className="text-gray-400 text-xs mt-0.5 truncate">
                      {item.customizations.join(", ")}
                    </p>
                  )}
                </div>
                <span className="text-gray-900 font-semibold text-sm ml-3 flex-shrink-0">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sticky total + pay CTA */}
      <div className="bg-white border-t border-gray-200 px-6 pb-8 pt-4 flex-shrink-0">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Subtotal</span>
          <span>${subtotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500 mb-3">
          <span>Tax (8.25%)</span>
          <span>${tax().toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-baseline mb-4 border-t border-gray-100 pt-3">
          <span className="text-xl font-bold text-gray-900">Total</span>
          <span className="text-3xl font-black text-mcdonalds-red">${total().toFixed(2)}</span>
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center mb-3 bg-red-50 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleConfirmOrder}
          disabled={submitting}
          className="w-full bg-mcdonalds-red text-white text-xl font-bold py-5 rounded-2xl shadow-lg hover:bg-[#C41E3A] active:scale-[0.98] transition-all disabled:opacity-50 min-h-[68px] touch-manipulation"
        >
          {submitting
            ? "Processing..."
            : paymentMethod === "card"
            ? `Tap to Pay  $${total().toFixed(2)}`
            : paymentMethod === "mobile_pay"
            ? `Pay with Mobile  $${total().toFixed(2)}`
            : `Pay at Counter  $${total().toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
