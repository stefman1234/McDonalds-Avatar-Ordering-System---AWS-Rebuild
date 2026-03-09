"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FlyItem {
  id: number;
  startX: number;
  startY: number;
  emoji: string;
}

export default function CartFlyOverlay() {
  const [flyItems, setFlyItems] = useState<FlyItem[]>([]);
  const cartRectRef = useRef<DOMRect | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    function getCartRect() {
      const btn = document.querySelector("[aria-label^='View cart']");
      if (btn) cartRectRef.current = btn.getBoundingClientRect();
    }

    function handleFly(e: Event) {
      const { x, y, emoji } = (e as CustomEvent<{ x: number; y: number; emoji: string }>).detail;
      getCartRect();
      const id = ++idRef.current;
      setFlyItems((prev) => [...prev, { id, startX: x, startY: y, emoji }]);
      setTimeout(() => {
        setFlyItems((prev) => prev.filter((i) => i.id !== id));
      }, 750);
    }

    window.addEventListener("cart-fly", handleFly);
    return () => window.removeEventListener("cart-fly", handleFly);
  }, []);

  const cartRect = cartRectRef.current;
  const targetX = cartRect ? cartRect.left + cartRect.width / 2 - 12 : 0;
  const targetY = cartRect ? cartRect.top + cartRect.height / 2 - 12 : 0;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200]" aria-hidden="true">
      <AnimatePresence>
        {flyItems.map((item) => (
          <motion.div
            key={item.id}
            className="fixed text-2xl select-none"
            style={{ left: 0, top: 0 }}
            initial={{ x: item.startX - 12, y: item.startY - 12, opacity: 1, scale: 1 }}
            animate={{ x: targetX, y: targetY, opacity: 0, scale: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {item.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
