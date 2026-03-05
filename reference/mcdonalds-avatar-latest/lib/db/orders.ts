import prisma from '@/lib/prisma';
import type { Prisma } from '@/lib/generated/prisma';

/**
 * Generate a unique order number
 */
export async function generateOrderNumber(): Promise<string> {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
}

/**
 * Create a new order
 */
export async function createOrder(data: {
  customerName?: string;
  orderType: string;
  subtotal: number;
  tax: number;
  total: number;
  sessionId?: string;
  items: {
    menuItemId?: string;
    comboMealId?: string;
    quantity: number;
    size?: string;
    unitPrice: number;
    lineTotal: number;
    customizations?: any;
    specialInstructions?: string;
  }[];
}) {
  const orderNumber = await generateOrderNumber();

  return prisma.orders.create({
    data: {
      order_number: orderNumber,
      customer_name: data.customerName,
      order_type: data.orderType,
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      session_id: data.sessionId,
      order_items: {
        create: data.items.map((item) => ({
          menu_item_id: item.menuItemId,
          combo_meal_id: item.comboMealId,
          quantity: item.quantity,
          size: item.size,
          unit_price: item.unitPrice,
          line_total: item.lineTotal,
          customizations: item.customizations,
          special_instructions: item.specialInstructions,
        })),
      },
    },
    include: {
      order_items: {
        include: {
          menu_items: true,
          combo_meals: true,
        },
      },
    },
  });
}

/**
 * Get order by ID
 */
export async function getOrderById(id: string) {
  return prisma.orders.findUnique({
    where: { id },
    include: {
      order_items: {
        include: {
          menu_items: true,
          combo_meals: true,
        },
      },
    },
  });
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string) {
  return prisma.orders.findUnique({
    where: { order_number: orderNumber },
    include: {
      order_items: {
        include: {
          menu_items: true,
          combo_meals: true,
        },
      },
    },
  });
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string
) {
  return prisma.orders.update({
    where: { id: orderId },
    data: {
      status,
      updated_at: new Date(),
    },
  });
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: string,
  paymentMethod?: string
) {
  return prisma.orders.update({
    where: { id: orderId },
    data: {
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      updated_at: new Date(),
    },
  });
}

/**
 * Get recent orders
 */
export async function getRecentOrders(limit: number = 10) {
  return prisma.orders.findMany({
    orderBy: {
      created_at: 'desc',
    },
    take: limit,
    include: {
      order_items: {
        include: {
          menu_items: true,
          combo_meals: true,
        },
      },
    },
  });
}

/**
 * Get orders by status
 */
export async function getOrdersByStatus(status: string) {
  return prisma.orders.findMany({
    where: { status },
    orderBy: {
      created_at: 'desc',
    },
    include: {
      order_items: {
        include: {
          menu_items: true,
          combo_meals: true,
        },
      },
    },
  });
}
