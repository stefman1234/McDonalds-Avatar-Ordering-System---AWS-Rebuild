import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

/**
 * POST /api/order
 *
 * Create a new order with items
 *
 * Request Body:
 * {
 *   customer_name: string (optional),
 *   order_type: 'dine_in' | 'takeout',
 *   items: Array<{
 *     menu_item_id?: string,
 *     combo_meal_id?: string,
 *     quantity: number,
 *     size?: string,
 *     unit_price: number,
 *     line_total: number,
 *     customizations?: Array,
 *     special_instructions?: string
 *   }>,
 *   subtotal: number,
 *   tax: number,
 *   total: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.order_type || !['dine_in', 'takeout'].includes(body.order_type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid order_type. Must be "dine_in" or "takeout"',
        },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order must contain at least one item',
        },
        { status: 400 }
      );
    }

    // Generate unique order number
    const orderNumber = await generateOrderNumber();

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: body.customer_name || 'Guest',
        order_type: body.order_type,
        status: 'pending',
        subtotal: body.subtotal,
        tax: body.tax,
        total: body.total,
        payment_method: 'cash', // Default for now (will be updated later)
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create order',
          message: orderError?.message,
        },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = body.items.map((item: any) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      combo_meal_id: item.combo_meal_id,
      quantity: item.quantity,
      size: item.size || null,
      unit_price: item.unit_price,
      line_total: item.line_total,
      customizations: item.customizations || [],
      special_instructions: item.special_instructions || null,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Try to rollback order creation
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create order items',
          message: itemsError.message,
        },
        { status: 500 }
      );
    }

    // Return success
    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total: order.total,
        estimated_time: 10, // 10 minutes default
        created_at: order.created_at,
      },
      message: 'Order placed successfully',
    });
  } catch (error) {
    console.error('Error processing order:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process order',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a unique order number
 * Format: #1001, #1002, etc.
 */
async function generateOrderNumber(): Promise<string> {
  try {
    // Get the latest order number
    const { data: latestOrder } = await supabaseAdmin
      .from('orders')
      .select('order_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestOrder && latestOrder.order_number) {
      // Extract number from format "#1001" → 1001
      const lastNumber = parseInt(latestOrder.order_number.replace('#', ''));
      return `#${(lastNumber + 1).toString().padStart(4, '0')}`;
    }

    // First order
    return '#1001';
  } catch (error) {
    // If no orders exist or error, start from 1001
    return `#${Date.now().toString().slice(-4)}`; // Fallback to timestamp
  }
}
