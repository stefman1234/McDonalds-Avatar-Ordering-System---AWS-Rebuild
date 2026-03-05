import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/combos
 *
 * Get all combo meals with optional filtering
 *
 * Query Parameters:
 * - popular: Filter by popularity (true/false)
 * - available: Filter by availability (true/false)
 * - search: Search by name
 *
 * Examples:
 * - GET /api/combos
 * - GET /api/combos?popular=true
 * - GET /api/combos?search=nuggets
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract query parameters
    const popularParam = searchParams.get('popular');
    const availableParam = searchParams.get('available');
    const searchQuery = searchParams.get('search');

    // Build query
    let query = supabase
      .from('combo_meals')
      .select('*')
      .order('popular', { ascending: false })
      .order('name', { ascending: true });

    // Apply filters
    if (availableParam !== null) {
      query = query.eq('available', availableParam === 'true');
    } else {
      // Default to only available combos
      query = query.eq('available', true);
    }

    if (popularParam === 'true') {
      query = query.eq('popular', true);
    }

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    const { data: combos, error } = await query;

    if (error) {
      throw error;
    }

    // Transform to API response format
    const response = (combos || []).map(combo => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: response,
      count: response.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching combo meals:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch combo meals',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
