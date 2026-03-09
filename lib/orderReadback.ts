import type { CartItem } from "@/lib/types";

const TAX_RATE = 0.0825;

/**
 * Build a natural language readback of the cart for the avatar to speak.
 */
export function buildOrderReadback(items: CartItem[]): string {
  if (items.length === 0) {
    return "Your order is empty. What would you like to order?";
  }

  const itemDescriptions = items.map((item) => {
    const qty = item.quantity > 1 ? `${item.quantity} ` : "";
    const customizations =
      item.customizations.length > 0
        ? ` with ${item.customizations.join(" and ")}`
        : "";
    return `${qty}${item.name}${customizations}`;
  });

  // Natural language list (comma separated, "and" before last)
  let itemList: string;
  if (itemDescriptions.length === 1) {
    itemList = itemDescriptions[0];
  } else if (itemDescriptions.length === 2) {
    itemList = `${itemDescriptions[0]} and ${itemDescriptions[1]}`;
  } else {
    const last = itemDescriptions.pop();
    itemList = `${itemDescriptions.join(", ")}, and ${last}`;
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return `Alright, so you have ${itemList}. Your total comes to RM ${total.toFixed(2)}. Shall I place the order?`;
}

/**
 * Build a short confirmation after adding items.
 */
export function buildAddConfirmation(itemNames: string[]): string {
  if (itemNames.length === 0) return "";

  if (itemNames.length === 1) {
    return `Got it! ${itemNames[0]} added to your order. Anything else?`;
  }

  if (itemNames.length === 2) {
    return `Got it! ${itemNames[0]} and ${itemNames[1]} added. Anything else?`;
  }

  const last = itemNames.pop();
  return `Got it! ${itemNames.join(", ")}, and ${last} added. Anything else?`;
}
