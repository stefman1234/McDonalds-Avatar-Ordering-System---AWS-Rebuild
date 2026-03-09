/**
 * C2: Fly-to-cart animation trigger.
 * Called from MenuCard when an item is added.
 */
export function triggerFlyAnimation(fromRect: DOMRect, emoji: string) {
  const event = new CustomEvent("cart-fly", {
    detail: {
      x: fromRect.left + fromRect.width / 2,
      y: fromRect.top + fromRect.height / 2,
      emoji,
    },
  });
  window.dispatchEvent(event);
}
