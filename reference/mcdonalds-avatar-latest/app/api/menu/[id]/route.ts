import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/menu/[id]
 *
 * Get a single menu item by ID with size options and applicable customizations
 *
 * Path Parameters:
 * - id: Menu item UUID
 *
 * Example:
 * - GET /api/menu/123e4567-e89b-12d3-a456-426614174000
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Menu item ID is required',
        },
        { status: 400 }
      );
    }

    // Fetch menu item with sizes
    const { data: menuItem, error: itemError } = await supabase
      .from('menu_items')
      .select('*, menu_item_sizes(*)')
      .eq('id', id)
      .single();

    if (itemError || !menuItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Menu item not found',
          message: `No menu item found with ID: ${id}`,
        },
        { status: 404 }
      );
    }

    // Fetch applicable customizations for this item's category
    const { data: customizations, error: customError } = await supabase
      .from('customization_options')
      .select('*')
      .ilike('applicable_to', `%${menuItem.category}%`)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (customError) {
      console.error('Error fetching customizations:', customError);
    }

    // Transform to API response format
    const response = {
      id: menuItem.id,
      name: menuItem.name,
      category: menuItem.category,
      subcategory: menuItem.subcategory,
      description: menuItem.description,
      basePrice: parseFloat(menuItem.base_price),
      imageUrl: menuItem.image_url,
      calories: menuItem.calories,
      available: menuItem.available,
      vegetarian: menuItem.vegetarian,
      glutenFree: menuItem.gluten_free,
      timeRestriction: menuItem.time_restriction,
      popular: menuItem.popular,
      sizes: (menuItem.menu_item_sizes || []).map((size: any) => ({
        id: size.id,
        name: size.size_name,
        priceModifier: parseFloat(size.price_modifier || '0'),
        caloriesModifier: size.calories_modifier,
      })),
      customizations: (customizations || []).map(custom => ({
        id: custom.id,
        name: custom.name,
        category: custom.category,
        priceModifier: parseFloat(custom.price_modifier || '0'),
        applicableTo: custom.applicable_to,
      })),
    };

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching menu item:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch menu item',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
