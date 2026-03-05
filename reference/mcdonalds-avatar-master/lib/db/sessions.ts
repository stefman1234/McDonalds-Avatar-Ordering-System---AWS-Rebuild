import prisma from '@/lib/prisma';
import type { Prisma } from '@/lib/generated/prisma';

/**
 * Create a new conversation session
 */
export async function createConversationSession(sessionId: string) {
  return prisma.conversation_sessions.create({
    data: {
      session_id: sessionId,
      status: 'active',
      conversation_history: [],
      context_data: {},
    },
  });
}

/**
 * Get conversation session by session ID
 */
export async function getConversationSession(sessionId: string) {
  return prisma.conversation_sessions.findUnique({
    where: { session_id: sessionId },
  });
}

/**
 * Update conversation history
 */
export async function updateConversationHistory(
  sessionId: string,
  message: any
) {
  const session = await getConversationSession(sessionId);

  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const history = (session.conversation_history as any[]) || [];
  history.push(message);

  return prisma.conversation_sessions.update({
    where: { session_id: sessionId },
    data: {
      conversation_history: history,
      last_activity_at: new Date(),
    },
  });
}

/**
 * Update conversation step
 */
export async function updateConversationStep(
  sessionId: string,
  step: string
) {
  return prisma.conversation_sessions.update({
    where: { session_id: sessionId },
    data: {
      current_step: step,
      last_activity_at: new Date(),
    },
  });
}

/**
 * Update context data
 */
export async function updateContextData(
  sessionId: string,
  contextData: any
) {
  return prisma.conversation_sessions.update({
    where: { session_id: sessionId },
    data: {
      context_data: contextData,
      last_activity_at: new Date(),
    },
  });
}

/**
 * Link session to order
 */
export async function linkSessionToOrder(
  sessionId: string,
  orderId: string
) {
  return prisma.conversation_sessions.update({
    where: { session_id: sessionId },
    data: {
      order_id: orderId,
      last_activity_at: new Date(),
    },
  });
}

/**
 * End conversation session
 */
export async function endConversationSession(sessionId: string) {
  return prisma.conversation_sessions.update({
    where: { session_id: sessionId },
    data: {
      status: 'completed',
      ended_at: new Date(),
    },
  });
}

/**
 * Get active sessions (for cleanup)
 */
export async function getActiveSessions() {
  return prisma.conversation_sessions.findMany({
    where: {
      status: 'active',
    },
    orderBy: {
      last_activity_at: 'desc',
    },
  });
}

/**
 * Clean up abandoned sessions (older than 30 minutes)
 */
export async function cleanupAbandonedSessions() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  return prisma.conversation_sessions.updateMany({
    where: {
      status: 'active',
      last_activity_at: {
        lt: thirtyMinutesAgo,
      },
    },
    data: {
      status: 'abandoned',
      ended_at: new Date(),
    },
  });
}
