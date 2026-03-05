import { useCartStore } from "@/stores/cartStore";

// Reset store between tests
beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("cartStore", () => {
  it("starts with empty cart", () => {
    const { items } = useCartStore.getState();
    expect(items).toEqual([]);
  });

  it("adds an item to cart", () => {
    useCartStore.getState().addItem({
      menuItemId: 1,
      name: "Big Mac",
      quantity: 1,
      unitPrice: 5.99,
      customizations: [],
      imageUrl: null,
    });

    const { items } = useCartStore.getState();
    expect(items.length).toBe(1);
    expect(items[0].name).toBe("Big Mac");
    expect(items[0].quantity).toBe(1);
  });

  it("increments quantity for duplicate item", () => {
    const store = useCartStore.getState();
    store.addItem({
      menuItemId: 1,
      name: "Big Mac",
      quantity: 1,
      unitPrice: 5.99,
      customizations: [],
      imageUrl: null,
    });
    store.addItem({
      menuItemId: 1,
      name: "Big Mac",
      quantity: 2,
      unitPrice: 5.99,
      customizations: [],
      imageUrl: null,
    });

    const { items } = useCartStore.getState();
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(3);
  });

  it("treats same item with different customizations as separate", () => {
    const store = useCartStore.getState();
    store.addItem({
      menuItemId: 1,
      name: "Big Mac",
      quantity: 1,
      unitPrice: 5.99,
      customizations: [],
      imageUrl: null,
    });
    store.addItem({
      menuItemId: 1,
      name: "Big Mac",
      quantity: 1,
      unitPrice: 7.49,
      customizations: ["Extra Patty"],
      imageUrl: null,
    });

    const { items } = useCartStore.getState();
    expect(items.length).toBe(2);
  });

  it("removes item from cart", () => {
    const store = useCartStore.getState();
    store.addItem({
      menuItemId: 1,
      name: "Big Mac",
      quantity: 1,
      unitPrice: 5.99,
      customizations: [],
      imageUrl: null,
    });

    const { items } = useCartStore.getState();
    store.removeItem(items[0].id);
    expect(useCartStore.getState().items.length).toBe(0);
  });

  it("updates quantity", () => {
    const store = useCartStore.getState();
    store.addItem({
      menuItemId: 1,
      name: "Big Mac",
      quantity: 1,
      unitPrice: 5.99,
      customizations: [],
      imageUrl: null,
    });

    const id = useCartStore.getState().items[0].id;
    store.updateQuantity(id, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it("removes item when quantity set to 0", () => {
    const store = useCartStore.getState();
    store.addItem({
      menuItemId: 1,
      name: "Big Mac",
      quantity: 1,
      unitPrice: 5.99,
      customizations: [],
      imageUrl: null,
    });

    const id = useCartStore.getState().items[0].id;
    store.updateQuantity(id, 0);
    expect(useCartStore.getState().items.length).toBe(0);
  });

  it("clears all items", () => {
    const store = useCartStore.getState();
    store.addItem({ menuItemId: 1, name: "Big Mac", quantity: 1, unitPrice: 5.99, customizations: [], imageUrl: null });
    store.addItem({ menuItemId: 4, name: "Fries", quantity: 1, unitPrice: 3.49, customizations: [], imageUrl: null });
    store.clearCart();
    expect(useCartStore.getState().items.length).toBe(0);
  });

  it("calculates subtotal correctly", () => {
    const store = useCartStore.getState();
    store.addItem({ menuItemId: 1, name: "Big Mac", quantity: 2, unitPrice: 5.99, customizations: [], imageUrl: null });
    store.addItem({ menuItemId: 4, name: "Fries", quantity: 1, unitPrice: 3.49, customizations: [], imageUrl: null });

    expect(useCartStore.getState().subtotal()).toBeCloseTo(15.47, 2);
  });

  it("calculates tax correctly (8.25%)", () => {
    const store = useCartStore.getState();
    store.addItem({ menuItemId: 1, name: "Big Mac", quantity: 1, unitPrice: 10.0, customizations: [], imageUrl: null });

    expect(useCartStore.getState().tax()).toBeCloseTo(0.83, 2);
  });

  it("calculates total (subtotal + tax)", () => {
    const store = useCartStore.getState();
    store.addItem({ menuItemId: 1, name: "Big Mac", quantity: 1, unitPrice: 10.0, customizations: [], imageUrl: null });

    expect(useCartStore.getState().total()).toBeCloseTo(10.83, 2);
  });

  it("itemCount sums quantities", () => {
    const store = useCartStore.getState();
    store.addItem({ menuItemId: 1, name: "Big Mac", quantity: 2, unitPrice: 5.99, customizations: [], imageUrl: null });
    store.addItem({ menuItemId: 4, name: "Fries", quantity: 3, unitPrice: 3.49, customizations: [], imageUrl: null });

    expect(useCartStore.getState().itemCount()).toBe(5);
  });

  it("cartSummary returns 'Empty' for no items", () => {
    expect(useCartStore.getState().cartSummary()).toBe("Empty");
  });

  it("cartSummary formats items with quantity and customizations", () => {
    const store = useCartStore.getState();
    store.addItem({ menuItemId: 1, name: "Big Mac", quantity: 2, unitPrice: 5.99, customizations: ["No Pickles"], imageUrl: null });

    const summary = useCartStore.getState().cartSummary();
    expect(summary).toContain("2x Big Mac");
    expect(summary).toContain("No Pickles");
  });
});
