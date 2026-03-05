import { useUIStore } from "@/stores/uiStore";

beforeEach(() => {
  useUIStore.setState({
    menuOpen: false,
    cartOpen: false,
    isListening: false,
    isProcessing: false,
    chatMessages: [],
    avatarReady: false,
  });
});

describe("uiStore", () => {
  it("opens menu and closes cart", () => {
    useUIStore.getState().setMenuOpen(true);
    const state = useUIStore.getState();
    expect(state.menuOpen).toBe(true);
    expect(state.cartOpen).toBe(false);
  });

  it("opens cart and closes menu", () => {
    useUIStore.getState().setMenuOpen(true);
    useUIStore.getState().setCartOpen(true);
    const state = useUIStore.getState();
    expect(state.cartOpen).toBe(true);
    expect(state.menuOpen).toBe(false);
  });

  it("toggles listening state", () => {
    useUIStore.getState().setListening(true);
    expect(useUIStore.getState().isListening).toBe(true);
    useUIStore.getState().setListening(false);
    expect(useUIStore.getState().isListening).toBe(false);
  });

  it("toggles processing state", () => {
    useUIStore.getState().setProcessing(true);
    expect(useUIStore.getState().isProcessing).toBe(true);
  });

  it("adds chat messages with id and timestamp", () => {
    useUIStore.getState().addChatMessage({ role: "user", text: "Hello" });
    const messages = useUIStore.getState().chatMessages;
    expect(messages.length).toBe(1);
    expect(messages[0].role).toBe("user");
    expect(messages[0].text).toBe("Hello");
    expect(messages[0].id).toBeDefined();
    expect(messages[0].timestamp).toBeGreaterThan(0);
  });

  it("appends messages in order", () => {
    const store = useUIStore.getState();
    store.addChatMessage({ role: "user", text: "Hi" });
    store.addChatMessage({ role: "assistant", text: "Hello!" });
    const messages = useUIStore.getState().chatMessages;
    expect(messages.length).toBe(2);
    expect(messages[0].text).toBe("Hi");
    expect(messages[1].text).toBe("Hello!");
  });

  it("clears all messages", () => {
    useUIStore.getState().addChatMessage({ role: "user", text: "Hi" });
    useUIStore.getState().addChatMessage({ role: "assistant", text: "Hello!" });
    useUIStore.getState().clearMessages();
    expect(useUIStore.getState().chatMessages.length).toBe(0);
  });

  it("sets avatar ready state", () => {
    useUIStore.getState().setAvatarReady(true);
    expect(useUIStore.getState().avatarReady).toBe(true);
  });
});
