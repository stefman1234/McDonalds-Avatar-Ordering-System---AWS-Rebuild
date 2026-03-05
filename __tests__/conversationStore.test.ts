import { useConversationStore } from "@/stores/conversationStore";

beforeEach(() => {
  useConversationStore.getState().reset();
});

describe("conversationStore", () => {
  it("starts with empty state", () => {
    const state = useConversationStore.getState();
    expect(state.orderedCategories).toEqual([]);
    expect(state.preferredSize).toBeNull();
  });

  it("adds ordered category", () => {
    useConversationStore.getState().addOrderedCategory("Burgers");
    expect(useConversationStore.getState().orderedCategories).toEqual(["Burgers"]);
  });

  it("does not duplicate categories", () => {
    const store = useConversationStore.getState();
    store.addOrderedCategory("Burgers");
    store.addOrderedCategory("Burgers");
    expect(useConversationStore.getState().orderedCategories).toEqual(["Burgers"]);
  });

  it("accumulates multiple categories", () => {
    const store = useConversationStore.getState();
    store.addOrderedCategory("Burgers");
    store.addOrderedCategory("Drinks");
    expect(useConversationStore.getState().orderedCategories).toEqual(["Burgers", "Drinks"]);
  });

  it("sets preferred size", () => {
    useConversationStore.getState().setPreferredSize("large");
    expect(useConversationStore.getState().preferredSize).toBe("large");
  });

  it("canSuggest returns true when no prior suggestion", () => {
    expect(useConversationStore.getState().canSuggest("pairing")).toBe(true);
  });

  it("canSuggest returns false within cooldown period", () => {
    useConversationStore.getState().markSuggested("pairing");
    expect(useConversationStore.getState().canSuggest("pairing")).toBe(false);
  });

  it("canSuggest allows different types independently", () => {
    useConversationStore.getState().markSuggested("pairing");
    expect(useConversationStore.getState().canSuggest("upsell")).toBe(true);
  });

  it("reset clears all state", () => {
    const store = useConversationStore.getState();
    store.addOrderedCategory("Burgers");
    store.setPreferredSize("large");
    store.markSuggested("pairing");
    store.reset();

    const state = useConversationStore.getState();
    expect(state.orderedCategories).toEqual([]);
    expect(state.preferredSize).toBeNull();
    expect(state.suggestionsGiven.size).toBe(0);
  });
});
