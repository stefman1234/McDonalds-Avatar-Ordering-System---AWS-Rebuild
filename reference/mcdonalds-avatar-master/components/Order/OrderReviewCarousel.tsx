'use client';

import React, { useState } from 'react';
import { CartItem } from '@/store/cart';

interface OrderReviewCarouselProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
}

export function OrderReviewCarousel({ items, onRemoveItem }: OrderReviewCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const calculateItemTotal = (item: CartItem): number => {
    let total = item.basePrice;

    // Add meal upcharge if it's a combo
    if (item.isCombo) {
      total += 2.50; // Base meal upcharge
      if (item.mealSize === 'large') {
        total += 1.00; // Large meal upcharge
      }
    }

    if (item.selectedSize) {
      total += item.selectedSize.priceModifier;
    }

    item.customizations.forEach(customization => {
      total += customization.priceModifier;
    });

    // Add meal side price modifier
    if (item.mealSide) {
      total += item.mealSide.priceModifier;
    }

    // Add meal drink price modifier
    if (item.mealDrink) {
      total += item.mealDrink.priceModifier;
    }

    return total * item.quantity;
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  if (items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];
  const itemTotal = calculateItemTotal(currentItem);

  return (
    <div className="h-full flex flex-col bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Your Order ({items.length} items)</h2>
        <div className="flex gap-2">
          {items.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="p-2 rounded-full bg-white border-2 border-gray-300 hover:border-mcd-red transition-colors"
                aria-label="Previous item"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-full bg-white border-2 border-gray-300 hover:border-mcd-red transition-colors"
                aria-label="Next item"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Current Item Card */}
      <div className="flex-1 bg-white rounded-lg shadow-md p-6 overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentItem.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <span className="bg-mcd-red text-white px-3 py-1 rounded-full font-medium">
                Qty: {currentItem.quantity}
              </span>
              {currentItem.selectedSize && (
                <span className="bg-gray-100 px-3 py-1 rounded-full">
                  {currentItem.selectedSize.name}
                </span>
              )}
              {currentItem.isCombo && (
                <span className="bg-mcd-yellow text-gray-900 px-3 py-1 rounded-full font-medium">
                  Combo
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onRemoveItem(currentItem.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Remove item"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Meal Information */}
        {currentItem.isCombo && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Meal Details:</h4>
            <div className="space-y-1">
              {currentItem.mealSize && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Size:</span> {currentItem.mealSize === 'medium' ? 'Medium' : 'Large'}
                </p>
              )}
              {currentItem.mealSide && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Side:</span> {currentItem.mealSide.name}
                </p>
              )}
              {currentItem.mealDrink && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Drink:</span> {currentItem.mealDrink.name}
                  {currentItem.mealDrink.iceLevel && (
                    <span className="ml-1 text-gray-500">
                      ({currentItem.mealDrink.iceLevel === 'none' ? 'No Ice' :
                        currentItem.mealDrink.iceLevel === 'less' ? 'Less Ice' : 'Full Ice'})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Customizations */}
        {currentItem.customizations && currentItem.customizations.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Customizations:</h4>
            <ul className="space-y-1">
              {currentItem.customizations.map((customization, idx) => (
                <li key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-700">{customization.name}</span>
                  {customization.priceModifier !== 0 && (
                    <span className="text-gray-600">
                      {customization.priceModifier > 0 ? '+' : ''}
                      ${customization.priceModifier.toFixed(2)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Special Instructions */}
        {currentItem.specialInstructions && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Special Instructions:</h4>
            <p className="text-sm text-gray-600 italic">{currentItem.specialInstructions}</p>
          </div>
        )}

        {/* Price */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Item Total:</span>
            <span className="text-2xl font-bold text-mcd-red">${itemTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Item Counter */}
      {items.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-mcd-red w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to item ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
