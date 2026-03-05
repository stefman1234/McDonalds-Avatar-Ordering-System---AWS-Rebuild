import { NextRequest, NextResponse } from 'next/server';
import { processOrderSpeech } from '@/lib/nlp/orderProcessor';
import { supabase } from '@/lib/supabase/client';
import { getMatches, getItemNotFoundMessage } from '@/lib/utils/fuzzyMatcher';

export async function POST(request: NextRequest) {
  try {
    const { userText, conversationHistory = [] } = await request.json();

    if (!userText || typeof userText !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid request: userText required' },
        { status: 400 }
      );
    }

    // Fetch menu items from database with tags and search_terms for fuzzy matching
    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('id, name, base_price, category, subcategory, tags, search_terms, description, popular, available, vegetarian, gluten_free, image_url, calories')
      .eq('available', true);

    if (error) {
      throw error;
    }

    console.log('[API] Successfully fetched menu from database');
    console.log(`[API] Conversation history: ${conversationHistory.length} messages`);

    // Process order with NLP (with conversation context)
    const result = await processOrderSpeech(userText, menuItems, conversationHistory);

    // Skip fuzzy matching for specific intents that should not trigger item search
    const skipFuzzyMatchIntents = ['remove', 'modify', 'checkout', 'meal_response'];
    const shouldSkipFuzzyMatch = skipFuzzyMatchIntents.includes(result.intent);

    // If intent is unclear or confidence is low, try fuzzy matching
    // BUT skip for remove/modify/checkout/meal_response intents
    if (!shouldSkipFuzzyMatch &&
        (result.intent === 'unclear' ||
        (result.items.length === 0 && !result.clarificationNeeded) ||
        result.items.some(item => item.confidence < 0.5))) {

      console.log(`[Fuzzy Match] Attempting fuzzy match for: "${userText}"`);

      // Try to find matches using fuzzy search
      const matches = getMatches(userText, menuItems);

      if (matches.length > 0) {
        console.log(`[Fuzzy Match] Found ${matches.length} matches`);

        // Transform database field names to match frontend expectations
        const transformedMatches = matches.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          subcategory: item.subcategory,
          description: item.description,
          basePrice: item.base_price,
          imageUrl: item.image_url,
          calories: item.calories,
          available: true, // All items from query are available (filtered by .eq('available', true))
          vegetarian: item.vegetarian || false,
          glutenFree: item.gluten_free || false,
          popular: item.popular || false,
        }));

        // Return item_not_found response with filtered items
        const message = getItemNotFoundMessage(userText, matches);

        return NextResponse.json({
          success: true,
          data: {
            ...result,
            itemNotFound: true,
            filteredItems: transformedMatches,
            filterQuery: userText,
            filterMessage: message,
            response: message,
          },
        });
      }
    }

    // Log the result before returning
    console.log(`[API] Returning result - Intent: ${result.intent}, Items: ${result.items?.length || 0}`);

    // Return result with all fields including mealResponse
    return NextResponse.json({
      success: true,
      data: {
        items: result.items,
        intent: result.intent,
        clarificationNeeded: result.clarificationNeeded,
        response: result.response,
        mealResponse: result.mealResponse,
      },
    });
  } catch (error) {
    console.error('[API] Parse order error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse order',
      },
      { status: 500 }
    );
  }
}
