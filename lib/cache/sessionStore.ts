import { putItem, getItem, deleteItem, getTableName } from "@/lib/dynamodb";

export interface Session {
  sessionId: string;
  status: "active" | "completed" | "abandoned";
  conversationHistory: { role: string; text: string; timestamp: number }[];
  currentStep: "greeting" | "ordering" | "customizing" | "confirming";
  orderId: string | null;
  startedAt: number;
  lastActivityAt: number;
}

// L1: In-memory cache (fast reads, lost on restart)
const sessions = new Map<string, Session>();

const SESSION_TTL = 60 * 60 * 1000; // 1 hour

function cleanup() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastActivityAt > SESSION_TTL) {
      sessions.delete(id);
    }
  }
}

function dynamoTable(): string {
  return getTableName("sessions");
}

function ttlEpoch(): number {
  return Math.floor((Date.now() + SESSION_TTL) / 1000);
}

async function writeToDynamo(session: Session): Promise<void> {
  await putItem(dynamoTable(), {
    sessionId: session.sessionId,
    data: JSON.stringify(session),
    expiresAt: ttlEpoch(),
  });
}

async function readFromDynamo(id: string): Promise<Session | null> {
  const item = await getItem(dynamoTable(), { sessionId: id });
  if (!item || !item.data) return null;
  try {
    return JSON.parse(item.data as string) as Session;
  } catch {
    return null;
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
  // Fire-and-forget DynamoDB write (don't block session creation)
  writeToDynamo(session).catch(() => {});
  return session;
}

export async function getSession(id: string): Promise<Session | null> {
  // L1: Check in-memory
  const cached = sessions.get(id);
  if (cached) {
    if (Date.now() - cached.lastActivityAt > SESSION_TTL) {
      sessions.delete(id);
      deleteItem(dynamoTable(), { sessionId: id }).catch(() => {});
      return null;
    }
    return cached;
  }

  // L2: Check DynamoDB
  const dynamo = await readFromDynamo(id);
  if (dynamo) {
    if (Date.now() - dynamo.lastActivityAt > SESSION_TTL) {
      deleteItem(dynamoTable(), { sessionId: id }).catch(() => {});
      return null;
    }
    sessions.set(id, dynamo); // Populate L1
    return dynamo;
  }

  return null;
}

export async function updateSession(
  id: string,
  updates: Partial<Omit<Session, "sessionId" | "startedAt">>
): Promise<Session | null> {
  // Try L1 first, then L2
  let session = sessions.get(id) ?? null;
  if (!session) {
    session = await readFromDynamo(id);
  }
  if (!session) return null;

  Object.assign(session, updates, { lastActivityAt: Date.now() });
  sessions.set(id, session);
  writeToDynamo(session).catch(() => {});
  return session;
}
