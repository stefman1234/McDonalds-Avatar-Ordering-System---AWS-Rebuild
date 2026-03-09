"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/stores/cartStore";
import { useUIStore } from "@/stores/uiStore";
import { useConversationStore } from "@/stores/conversationStore";
import CartItemComponent from "./CartItem";
import { speak } from "@/lib/klleon/avatar";
import { buildOrderReadback } from "@/lib/orderReadback";

type OrderType = "dine_in" | "takeout";
type PaymentMethod = "card" | "mobile_pay" | "cash";
type Step = "review" | "processing" | "receipt";

interface ReceiptData {
  orderId: number;
  items: { name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  tax: number;
  total: number;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
}

export default function CheckoutModal() {
  const router = useRouter();
  const checkoutOpen = useUIStore((s) => s.checkoutOpen);
  const setCheckoutOpen = useUIStore((s) => s.setCheckoutOpen);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const tax = useCartStore((s) => s.tax);
  const total = useCartStore((s) => s.total);
  const clearCart = useCartStore((s) => s.clearCart);
  const resetConversation = useConversationStore((s) => s.reset);

  const [step, setStep] = useState<Step>("review");
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Read back the order when modal opens
  useEffect(() => {
    if (checkoutOpen && items.length > 0) {
      setStep("review");
      setError(null);
      setReceiptData(null);
      // Small delay so modal finishes animating in before avatar speaks
      setTimeout(() => speak(buildOrderReadback(items)), 600);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutOpen]);

  // Avatar speaks confirmation when receipt is shown
  useEffect(() => {
    if (step === "receipt" && receiptData) {
      const typeText = receiptData.orderType === "dine_in" ? "dine in" : "takeout";
      speak(
        `Your order is confirmed! Your number is ${receiptData.orderId}. ` +
          `Your total was $${receiptData.total.toFixed(2)} for ${typeText}. ` +
          `We'll have your food ready soon — enjoy your meal!`
      );
    }
  }, [step, receiptData]);

  async function handleConfirm() {
    if (items.length === 0) return;
    setStep("processing");
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

      // Simulate payment (fire-and-forget — it's a demo)
      await fetch("/api/payment/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId, amount: order.total, method: paymentMethod }),
      }).catch(() => {});

      setReceiptData({
        orderId: order.orderId,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        orderType,
        paymentMethod,
      });
      clearCart();
      setStep("receipt");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("review");
    }
  }

  function handleNewOrder() {
    setCheckoutOpen(false);
    resetConversation();
    router.push("/");
  }

  const payLabel =
    paymentMethod === "card"
      ? "Tap to Pay"
      : paymentMethod === "mobile_pay"
      ? "Pay with Mobile"
      : "Pay at Counter";

  return (
    <AnimatePresence>
      {checkoutOpen && (
        <motion.div
          key="checkout-modal"
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 bg-gray-50 z-[150] flex flex-col"
        >
          {/* ─── REVIEW ─── */}
          {step === "review" && (
            <>
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Review Your Order</h1>
                <button
                  onClick={() => setCheckoutOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close checkout"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="px-6 pt-4">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <span className="text-5xl mb-4">🛒</span>
                      <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
                      <button onClick={() => setCheckoutOpen(false)} className="btn-secondary">
                        Continue Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {items.map((item) => (
                        <CartItemComponent key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="px-6 pb-6 mt-4 space-y-5">
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
                            className={`flex-1 flex flex-col items-center gap-1 py-4 rounded-2xl font-semibold transition-all min-h-[80px] touch-manipulation ${
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
                      <button
                        onClick={() => setPaymentMethod("card")}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl mb-3 border-2 transition-all min-h-[72px] touch-manipulation ${
                          paymentMethod === "card"
                            ? "border-mcdonalds-red bg-red-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === "card" ? "bg-mcdonalds-red text-white" : "bg-gray-100"
                          }`}
                        >
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
                        {(["mobile_pay", "cash"] as const).map((m) => (
                          <button
                            key={m}
                            onClick={() => setPaymentMethod(m)}
                            className={`flex-1 flex flex-col items-center gap-1 py-4 rounded-2xl border-2 font-medium transition-all min-h-[72px] touch-manipulation ${
                              paymentMethod === m
                                ? "border-mcdonalds-red bg-red-50 text-mcdonalds-red"
                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            <span className="text-2xl">{m === "mobile_pay" ? "📱" : "💵"}</span>
                            <span className="text-sm">{m === "mobile_pay" ? "Mobile Pay" : "Cash"}</span>
                            <span className="text-[10px] text-gray-400">
                              {m === "mobile_pay" ? "Apple Pay · GrabPay" : "Pay at counter"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </div>

              {/* Sticky footer */}
              {items.length > 0 && (
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
                    <p className="text-red-600 text-sm text-center mb-3 bg-red-50 rounded-xl px-3 py-2">{error}</p>
                  )}
                  <button
                    onClick={handleConfirm}
                    className="w-full bg-mcdonalds-red text-white text-xl font-bold py-5 rounded-2xl shadow-lg hover:bg-[#C41E3A] active:scale-[0.98] transition-all min-h-[68px] touch-manipulation"
                  >
                    {payLabel} · ${total().toFixed(2)}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ─── PROCESSING ─── */}
          {step === "processing" && (
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
              <div className="w-24 h-24 border-4 border-mcdonalds-red border-t-transparent rounded-full animate-spin mb-8" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
              <p className="text-gray-500">Please wait a moment...</p>
            </div>
          )}

          {/* ─── RECEIPT ─── */}
          {step === "receipt" && receiptData && (
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 text-center overflow-y-auto">
              {/* Success tick */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5 flex-shrink-0">
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-1">Order Confirmed!</h1>
              <p className="text-gray-500 mb-4">Your order number is</p>

              {/* Order number badge */}
              <div className="bg-mcdonalds-yellow text-gray-900 rounded-3xl mb-6 shadow-xl px-10 py-6 flex flex-col items-center flex-shrink-0">
                <span className="text-[5rem] font-black leading-none tracking-tight">
                  #{receiptData.orderId}
                </span>
                <span className="text-sm font-semibold text-gray-700 mt-1 uppercase tracking-widest">
                  Order Number
                </span>
              </div>

              {/* Receipt breakdown */}
              <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4 text-left">
                {receiptData.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between px-4 py-3 text-sm ${
                      idx < receiptData.items.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <span className="text-gray-700 font-medium">
                      {item.quantity > 1 && (
                        <span className="text-mcdonalds-red font-bold mr-1">{item.quantity}×</span>
                      )}
                      {item.name}
                    </span>
                    <span className="text-gray-900 font-semibold">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t-2 border-gray-200 px-4 py-3 space-y-1">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>${receiptData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Tax</span>
                    <span>${receiptData.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-1">
                    <span>Total</span>
                    <span className="text-mcdonalds-red">${receiptData.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 font-medium mb-1">
                {receiptData.orderType === "dine_in" ? "🍽 Dine In" : "🥡 Takeout"}
              </p>
              <p className="text-gray-400 text-sm mb-8">
                Your food is being prepared. Please wait for your number to be called.
              </p>

              <button
                onClick={handleNewOrder}
                className="btn-primary text-lg px-10 py-4 min-h-[60px]"
              >
                Start New Order
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
