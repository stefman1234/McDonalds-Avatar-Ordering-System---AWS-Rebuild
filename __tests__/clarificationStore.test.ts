import { useClarificationStore } from "@/stores/clarificationStore";
import { mockMenuItems } from "./fixtures";

beforeEach(() => {
  useClarificationStore.getState().dismiss();
});

describe("clarificationStore", () => {
  it("starts inactive", () => {
    const state = useClarificationStore.getState();
    expect(state.active).toBe(false);
    expect(state.type).toBeNull();
    expect(state.candidates).toEqual([]);
  });

  it("activates with type and query", () => {
    useClarificationStore.getState().activate("ambiguous", "chicken", mockMenuItems.slice(0, 2));
    const state = useClarificationStore.getState();
    expect(state.active).toBe(true);
    expect(state.type).toBe("ambiguous");
    expect(state.originalQuery).toBe("chicken");
    expect(state.candidates.length).toBe(2);
  });

  it("activates without candidates", () => {
    useClarificationStore.getState().activate("not_found", "pizza");
    const state = useClarificationStore.getState();
    expect(state.active).toBe(true);
    expect(state.type).toBe("not_found");
    expect(state.candidates).toEqual([]);
  });

  it("resolve resets to inactive", () => {
    useClarificationStore.getState().activate("ambiguous", "chicken", mockMenuItems.slice(0, 2));
    useClarificationStore.getState().resolve(mockMenuItems[0]);
    const state = useClarificationStore.getState();
    expect(state.active).toBe(false);
    expect(state.type).toBeNull();
    expect(state.candidates).toEqual([]);
  });

  it("dismiss resets to inactive", () => {
    useClarificationStore.getState().activate("size_needed", "coke");
    useClarificationStore.getState().dismiss();
    const state = useClarificationStore.getState();
    expect(state.active).toBe(false);
  });
});
