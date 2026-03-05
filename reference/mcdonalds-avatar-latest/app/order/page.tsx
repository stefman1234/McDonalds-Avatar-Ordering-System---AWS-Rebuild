'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MenuCarousel, MenuItem, CustomizationModal } from '@/components/Menu';
import { CategoryTabs, type Category } from '@/components/Menu/CategoryTabs';
import { OrderItemsCarousel, EmptyOrderState } from '@/components/Order';
import { CartButton, CartDrawer } from '@/components/Cart';
import { AvatarContainer } from '@/components/Avatar';
import { DebugPanel } from '@/components/Debug';
import { useCartStore } from '@/store/cart';

const INACTIVITY_TIMEOUT = 30000; // 30 seconds in milliseconds

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<Category>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);

  // Fuzzy match filter state
  const [filterMode, setFilterMode] = useState<'all' | 'filtered'>('all');
  const [fuzzyFilteredItems, setFuzzyFilteredItems] = useState<MenuItem[]>([]);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [filterMessage, setFilterMessage] = useState<string>('');

  const { addItem, items, removeItem, clearCart } = useCartStore();
  const router = useRouter();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // F8 key listener for debug panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault();
        setIsDebugOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch menu items on mount
  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Filter items when category changes
  useEffect(() => {
    filterItems();
  }, [menuItems, activeTab]);

  // Inactivity timer - reset kiosk after 30 seconds of no interaction
  useEffect(() => {
    const resetInactivityTimer = () => {
      // Clear existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Start new timer
      inactivityTimerRef.current = setTimeout(() => {
        console.log('[Inactivity] Resetting kiosk after 30 seconds of inactivity');

        // Clear cart
        clearCart();

        // Redirect to home
        router.push('/');
      }, INACTIVITY_TIMEOUT);
    };

    // Events to track for user activity
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];

    // Reset timer on any user activity
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Start initial timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [clearCart, router]);

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/menu');
      const result = await response.json();

      if (result.success) {
        setMenuItems(result.data);
      } else {
        setError(result.error || 'Failed to load menu items');
      }
    } catch (err) {
      setError('Failed to load menu items. Please try again.');
      console.error('Error fetching menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...menuItems];

    // Filter by category (skip filtering for 'your_order')
    if (activeTab !== 'all' && activeTab !== 'your_order') {
      // Map category IDs to database categories (database uses singular form)
      const categoryMap: Record<string, string> = {
        'burger': 'burger',
        'chicken': 'chicken',
        'sides': 'sides',
        'drinks': 'drinks',
        'desserts': 'desserts',
        'happy_meal': 'happy_meal',
      };
      const dbCategory = categoryMap[activeTab] || activeTab;
      filtered = filtered.filter(item => item.category === dbCategory);
    }

    setFilteredItems(filtered);
  };

  const handleAddToCart = (item: MenuItem) => {
    // Add item to cart with default settings
    addItem({
      menuItemId: item.id,
      name: item.name,
      basePrice: item.basePrice,
      quantity: 1,
      customizations: [],
      isCombo: false,
    });

    // Item added - cart will show in "Your Order" tab
    // No auto-open of cart drawer
  };

  const handleCustomize = (item: MenuItem) => {
    setSelectedItem(item);
    setIsCustomizationOpen(true);
  };

  const handleCustomizeCartItem = (cartItem: any) => {
    // Find the menu item corresponding to this cart item
    const menuItem = menuItems.find(item => item.id === cartItem.menuItemId);

    if (menuItem) {
      // Store the cart item ID being edited (don't remove yet)
      setEditingCartItemId(cartItem.id);

      // Open customization modal with the menu item
      setSelectedItem(menuItem);
      setIsCustomizationOpen(true);
    } else {
      console.error('Menu item not found for cart item:', cartItem);
    }
  };

  const handleCustomizationAddToCart = (customizedItem: any) => {
    // If editing an existing cart item, remove it first
    if (editingCartItemId) {
      removeItem(editingCartItemId);
      setEditingCartItemId(null);
    }

    // Add customized item to cart
    addItem({
      menuItemId: customizedItem.menuItemId,
      name: customizedItem.name,
      basePrice: customizedItem.basePrice,
      quantity: customizedItem.quantity,
      selectedSize: customizedItem.selectedSize,
      customizations: customizedItem.customizations,
      specialInstructions: customizedItem.specialInstructions,
      isCombo: customizedItem.isCombo || false,
      mealSize: customizedItem.mealSize,
      mealSide: customizedItem.mealSide,
      mealDrink: customizedItem.mealDrink,
    });

    // Close modal - user can view items in "Your Order" tab
    setIsCustomizationOpen(false);
  };

  // Handle item not found - triggered by avatar when fuzzy matching activates
  const handleItemNotFound = (filteredItems: MenuItem[], query: string, message: string) => {
    console.log(`[Filter] Showing ${filteredItems.length} matches for "${query}"`);

    // Switch to menu tab if on your_order
    if (activeTab === 'your_order') {
      setActiveTab('all');
    }

    // Set filter mode and filtered items
    setFilterMode('filtered');
    setFuzzyFilteredItems(filteredItems);
    setFilterQuery(query);
    setFilterMessage(message);
  };

  // Clear filter mode
  const handleClearFilter = () => {
    console.log('[Filter] Clearing filter, returning to normal mode');
    setFilterMode('all');
    setFuzzyFilteredItems([]);
    setFilterQuery('');
    setFilterMessage('');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header - Compact for kiosk */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0 sticky top-0 z-[9999]">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            {/* Logo - Compact */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-mcd-red rounded-full flex items-center justify-center">
                <span className="text-lg">🍔</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">McDonald's</h1>
                <p className="text-xs text-gray-600">Order with Casey</p>
              </div>
            </div>

            {/* Actions - Compact */}
            <div className="flex items-center gap-2">
              <Link
                href="/menu"
                className="text-xs text-mcd-red hover:text-mcd-dark-red font-medium transition-colors hidden sm:block"
              >
                Browse Menu →
              </Link>
              <CartButton onClick={() => setIsCartOpen(true)} />
            </div>
          </div>
        </div>
      </header>

      {/* Avatar Zone - Optimized for 1080x1920 portrait with full avatar visibility */}
      <div className="relative bg-gradient-to-br from-mcd-red to-mcd-dark-red py-4 flex-1">
        <AvatarContainer
          onReady={() => console.log('Avatar ready!')}
          onError={(error) => console.error('Avatar error:', error)}
          onItemAddedToCart={() => setActiveTab('your_order')}
          onItemNotFound={handleItemNotFound}
        />
      </div>

      {/* Menu Section - Fixed height for kiosk display */}
      <div className="flex-shrink-0 bg-white border-t-4 border-mcd-yellow" style={{ height: '35vh', minHeight: '300px' }}>
        {/* Category Tabs */}
        <CategoryTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Content Area - Conditionally show Menu or Your Order */}
        <div className="h-full">
          {activeTab === 'your_order' ? (
            // Show Order Items or Empty State
            items.length > 0 ? (
              <OrderItemsCarousel
                items={items}
                onRemoveItem={removeItem}
                onCustomizeItem={handleCustomizeCartItem}
              />
            ) : (
              <EmptyOrderState onBrowseMenu={() => setActiveTab('all')} />
            )
          ) : (
            // Show Menu Carousel
            error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <span className="text-5xl mb-3 block">⚠️</span>
                  <p className="text-gray-900 font-semibold mb-2">Oops! Something went wrong</p>
                  <p className="text-gray-600 text-sm mb-4">{error}</p>
                  <button onClick={fetchMenuItems} className="btn-primary">
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <MenuCarousel
                items={filteredItems}
                onAddToCart={handleAddToCart}
                onCustomize={handleCustomize}
                isLoading={isLoading}
                filterMode={filterMode}
                filteredItems={fuzzyFilteredItems}
                filterQuery={filterQuery}
                filterMessage={filterMessage}
                onClearFilter={handleClearFilter}
              />
            )
          )}
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Customization Modal */}
      {selectedItem && (
        <CustomizationModal
          isOpen={isCustomizationOpen}
          onClose={() => {
            setIsCustomizationOpen(false);
            setEditingCartItemId(null);
          }}
          item={selectedItem}
          onAddToCart={handleCustomizationAddToCart}
        />
      )}

      {/* Debug Panel - F8 to toggle */}
      <DebugPanel isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />
    </div>
  );
}
