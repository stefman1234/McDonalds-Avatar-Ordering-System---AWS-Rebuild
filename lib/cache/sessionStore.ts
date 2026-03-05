export interface Session {
  sessionId: string;
  status: "active" | "completed" | "abandoned";
  conversationHistory: { role: string; text: string; timestamp: number }[];
  currentStep: "greeting" | "ordering" | "customizing" | "confirming";
  orderId: string | null;
  startedAt: number;
  lastActivityAt: number;
}

// In-memory session store (replaced by DynamoDB in production)
const sessions = new Map<string, Session>();

// Auto-cleanup sessions older than 1 hour
const SESSION_TTL = 60 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastActivityAt > SESSION_TTL) {
      sessions.delete(id);
    }
  }
}

export function createSession(): Session {
  cleanup();
  const session: Session = {
    sessionId: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: "active",
    conversationHistory: [],
    currentStep: "greeting",
    orderId: null,
    startedAt: Date.now(),
    lastActivityAt: Date.now(),
  };
  sessions.set(session.sessionId, session);
  return session;
}

export function getSession(id: string): Session | null {
  const session = sessions.get(id);
  if (!session) return null;
  if (Date.now() - session.lastActivityAt > SESSION_TTL) {
    sessions.delete(id);
    return null;
  }
  return session;
}

export function updateSession(
  id: string,
  updates: Partial<Omit<Session, "sessionId" | "startedAt">>
): Session | null {
  const session = sessions.get(id);
  if (!session) return null;
  Object.assign(session, updates, { lastActivityAt: Date.now() });
  return session;
}
