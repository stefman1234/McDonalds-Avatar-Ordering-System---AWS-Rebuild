import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/combos/[id]
 *
 * Get a single combo meal by ID with included items details
 *
 * Path Parameters:
 * - id: Combo meal UUID
 *
 * Example:
 * - GET /api/combos/123e4567-e89b-12d3-a456-426614174000
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
          error: 'Combo meal ID is required',
        },
        { status: 400 }
      );
    }

    // Fetch combo meal
    const { data: combo, error: comboError } = await supabase
      .from('combo_meals')
      .select('*')
      .eq('id', id)
      .single();

    if (comboError || !combo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Combo meal not found',
          message: `No combo meal found with ID: ${id}`,
        },
        { status: 404 }
      );
    }

    // Transform to API response format
    const response = {
      id: combo.id,
      name: combo.name,
      description: combo.description,
      basePrice: parseFloat(combo.base_price),
      imageUrl: combo.image_url,
      calories: combo.calories,
      available: combo.available,
      popular: combo.popular,
      savings: combo.savings ? parseFloat(combo.savings) : null,
      includes: combo.includes, // JSONB field with included items
    };

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching combo meal:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch combo meal',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
