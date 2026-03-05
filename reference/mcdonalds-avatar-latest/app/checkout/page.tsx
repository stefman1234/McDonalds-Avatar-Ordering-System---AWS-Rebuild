'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/UI/Card';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, getItemCount, getItemTotal, clearCart } = useCartStore();

  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeout'>('dine_in');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = getTotal();
  const tax = subtotal * 0.0825; // 8.25% tax
  const total = subtotal + tax;
  const itemCount = getItemCount();

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardBody>
            <div className="text-center py-8">
              <span className="text-6xl mb-4 block">🛒</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some items to your cart before checking out.</p>
              <Link href="/" className="btn-primary inline-block">
                Back to Menu
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const orderData = {
        customer_name: customerName.trim() || 'Guest',
        order_type: orderType,
        items: items.map(item => ({
          menu_item_id: item.menuItemId,
          combo_meal_id: item.comboId,
          quantity: item.quantity,
          size: item.selectedSize?.name,
          unit_price: item.basePrice + (item.selectedSize?.priceModifier || 0),
          line_total: getItemTotal(item),
          customizations: item.customizations,
          special_instructions: item.specialInstructions,
        })),
        subtotal,
        tax,
        total,
      };

      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        // Clear cart and redirect to confirmation
        clearCart();
        router.push(`/confirmation?order=${result.data.order_number}`);
      } else {
        setError(result.error || 'Failed to place order');
      }
    } catch (err) {
      console.error('Order submission error:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-mcd-red hover:text-mcd-dark-red font-medium">
            ← Back to Menu
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Checkout</h1>
          <p className="text-gray-600 mt-1">Review your order and complete checkout</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Type */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900">Order Type</h2>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setOrderType('dine_in')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        orderType === 'dine_in'
                          ? 'border-mcd-red bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">🍽️</div>
                      <div className="font-semibold text-gray-900">Dine In</div>
                      <div className="text-xs text-gray-600">Eat here</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('takeout')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        orderType === 'takeout'
                          ? 'border-mcd-red bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">🥡</div>
                      <div className="font-semibold text-gray-900">Takeout</div>
                      <div className="text-xs text-gray-600">To go</div>
                    </button>
                  </div>
                </CardBody>
              </Card>

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900">Your Information</h2>
                </CardHeader>
                <CardBody>
                  <Input
                    label="Name (Optional)"
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    helperText="Leave blank to order as 'Guest'"
                  />
                </CardBody>
              </Card>

              {/* Order Review */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900">Order Review</h2>
                  <p className="text-sm text-gray-600 mt-1">{itemCount} items</p>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start pb-4 border-b border-gray-200 last:border-0">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {item.quantity}x {item.name}
                          </h4>
                          {item.selectedSize && (
                            <p className="text-sm text-gray-600">Size: {item.selectedSize.name}</p>
                          )}
                          {item.customizations && item.customizations.length > 0 && (
                            <ul className="text-sm text-gray-600 mt-1">
                              {item.customizations.map((custom, idx) => (
                                <li key={idx}>• {custom.name}</li>
                              ))}
                            </ul>
                          )}
                          {item.specialInstructions && (
                            <p className="text-sm text-gray-500 italic mt-1">Note: {item.specialInstructions}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-gray-900">${getItemTotal(item).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax (8.25%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-mcd-red">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}
                </CardBody>
                <CardFooter>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                  >
                    {isSubmitting ? 'Placing Order...' : 'Place Order'}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Payment will be processed at pickup
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
