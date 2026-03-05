import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/menu
 *
 * Get all menu items with optional filtering
 *
 * Query Parameters:
 * - category: Filter by category (burgers, chicken, breakfast, drinks, desserts, sides)
 * - available: Filter by availability (true/false)
 * - popular: Filter by popularity (true/false)
 * - time: Filter by time restriction (breakfast, lunch, all_day)
 *
 * Examples:
 * - GET /api/menu
 * - GET /api/menu?category=burgers
 * - GET /api/menu?popular=true
 * - GET /api/menu?time=breakfast
 * - GET /api/menu?category=burgers&available=true
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract query parameters
    const category = searchParams.get('category');
    const availableParam = searchParams.get('available');
    const popularParam = searchParams.get('popular');
    const timeRestriction = searchParams.get('time');

    // Build query
    let query = supabase
      .from('menu_items')
      .select('*, menu_item_sizes(*)')
      .order('popular', { ascending: false })
      .order('name', { ascending: true });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (availableParam !== null) {
      query = query.eq('available', availableParam === 'true');
    } else {
      // Default to only available items
      query = query.eq('available', true);
    }

    if (popularParam === 'true') {
      query = query.eq('popular', true);
    }

    if (timeRestriction) {
      query = query.eq('time_restriction', timeRestriction);
    }

    const { data: menuItems, error } = await query;

    if (error) {
      throw error;
    }

    console.log('[API] Successfully fetched menu from database');

    // Get current time for breakfast filtering
    const currentHour = new Date().getHours();
    const isBreakfastTime = currentHour >= 6 && currentHour < 11; // 6 AM - 11 AM

    // Filter out breakfast items if it's not breakfast time (unless explicitly requested)
    let filteredItems = menuItems || [];
    if (!timeRestriction) {
      filteredItems = filteredItems.filter(item => {
        if (item.time_restriction === 'breakfast' && !isBreakfastTime) {
          return false;
        }
        return true;
      });
    }

    // Transform to API response format
    const response = filteredItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      description: item.description,
      basePrice: parseFloat(item.base_price),
      imageUrl: item.image_url,
      calories: item.calories,
      available: item.available,
      vegetarian: item.vegetarian,
      glutenFree: item.gluten_free,
      timeRestriction: item.time_restriction,
      popular: item.popular,
      sizes: (item.menu_item_sizes || []).map((size: any) => ({
        id: size.id,
        name: size.size_name,
        priceModifier: parseFloat(size.price_modifier || '0'),
        caloriesModifier: size.calories_modifier,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: response,
      count: response.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching menu items:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch menu items',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
