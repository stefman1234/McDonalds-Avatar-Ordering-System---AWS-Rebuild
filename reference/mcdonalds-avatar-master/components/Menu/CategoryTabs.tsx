'use client';

import React from 'react';

export type Category =
  | 'all'
  | 'burger'
  | 'chicken'
  | 'sides'
  | 'drinks'
  | 'desserts'
  | 'happy_meal'
  | 'your_order';

interface CategoryTab {
  id: Category;
  label: string;
  icon: string;
}

const CATEGORY_TABS: CategoryTab[] = [
  { id: 'all', label: 'All', icon: '🍔' },
  { id: 'burger', label: 'Burgers', icon: '🍔' },
  { id: 'chicken', label: 'Chicken', icon: '🍗' },
  { id: 'sides', label: 'Sides', icon: '🍟' },
  { id: 'drinks', label: 'Drinks', icon: '🥤' },
  { id: 'desserts', label: 'Desserts', icon: '🍦' },
  { id: 'happy_meal', label: 'Happy Meal', icon: '🎁' },
  { id: 'your_order', label: 'Your Order', icon: '🛒' },
];

interface CategoryTabsProps {
  activeTab: Category;
  onTabChange: (category: Category) => void;
}

export function CategoryTabs({ activeTab, onTabChange }: CategoryTabsProps) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isYourOrder = tab.id === 'your_order';

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-200
                  ${isYourOrder
                    ? isActive
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                    : isActive
                      ? 'bg-mcd-red text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
