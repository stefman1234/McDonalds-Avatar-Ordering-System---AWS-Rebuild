'use client';

import React from 'react';

interface EmptyOrderStateProps {
  onBrowseMenu: () => void;
}

export function EmptyOrderState({ onBrowseMenu }: EmptyOrderStateProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 p-8">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-mcd-yellow rounded-full">
            <span className="text-6xl">🛒</span>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Your order is empty</h2>
        <p className="text-gray-600 mb-6">
          Start browsing the menu to add delicious items to your order!
        </p>

        {/* Browse Menu Button */}
        <button
          onClick={onBrowseMenu}
          className="inline-flex items-center gap-2 px-6 py-3 bg-mcd-red text-white rounded-lg font-semibold hover:bg-mcd-dark-red transition-colors shadow-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Browse Menu
        </button>

        {/* Helpful Tips */}
        <div className="mt-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 Quick Tips</h3>
          <ul className="text-xs text-gray-600 space-y-1 text-left">
            <li>• Tap on any menu item to add it to your order</li>
            <li>• Use "Customize" to modify your items</li>
            <li>• Speak to Casey to order by voice</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
