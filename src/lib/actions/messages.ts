"use server";

import { MembershipStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type ChatMessage = {
  id: string;
  fromMe: boolean;
  text: string;
  timeLabel: string;
};

export type ConversationSummary = {
  id: string;
  peerId: string;
  peerName: string;
  peerField: string;
  peerAvatarUrl?: string;
  preview: string;
  updatedLabel: string;
  unread: number;
};

export type ConversationDetail = ConversationSummary & {
  messages: ChatMessage[];
};

export type MessageActionResult =
  | { ok: true; conversationId?: string; message?: ChatMessage; detail?: ConversationDetail }
  | { ok: false; error: string };

async function getActiveStudentContext() {
  const session = await getSession();
  if (!session || session.role !== Role.STUDENT) return null;

  const membership = await prisma.residenceMembership.findFirst({
    where: { userId: session.userId, status: MembershipStatus.ACTIVE },
  });
  if (!membership) return null;

  return { session, residenceId: membership.residenceId };
}

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function formatRelative(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "À l’instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  return `Il y a ${days} j`;
}

function formatMessageTime(date: Date) {
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (sameDay) return time;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return `Hier ${time}`;

  return `${date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })} ${time}`;
}

function peerOf(
  row: {
    userAId: string;
    userBId: string;
    userA: {
      id: string;
      firstName: string;
      lastName: string;
      fieldOfStudy: string | null;
      avatarUrl: string | null;
    };
    userB: {
      id: string;
      firstName: string;
      lastName: string;
      fieldOfStudy: string | null;
      avatarUrl: string | null;
    };
  },
  userId: string,
) {
  return row.userAId === userId ? row.userB : row.userA;
}

function myLastRead(
  row: { userAId: string; userALastReadAt: Date; userBLastReadAt: Date },
  userId: string,
) {
  return row.userAId === userId ? row.userALastReadAt : row.userBLastReadAt;
}

const conversationInclude = {
  userA: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fieldOfStudy: true,
      avatarUrl: true,
    },
  },
  userB: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fieldOfStudy: true,
      avatarUrl: true,
    },
  },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
} as const;

function mapSummary(
  row: {
    id: string;
    userAId: string;
    userBId: string;
    updatedAt: Date;
    userALastReadAt: Date;
    userBLastReadAt: Date;
    userA: {
      id: string;
      firstName: string;
      lastName: string;
      fieldOfStudy: string | null;
      avatarUrl: string | null;
    };
    userB: {
      id: string;
      firstName: string;
      lastName: string;
      fieldOfStudy: string | null;
      avatarUrl: string | null;
    };
    messages: { body: string; createdAt: Date; senderId: string }[];
    _count?: { messages: number };
  },
  userId: string,
): ConversationSummary {
  const peer = peerOf(row, userId);
  const last = row.messages[0];
  return {
    id: row.id,
    peerId: peer.id,
    peerName: `${peer.firstName} ${peer.lastName}`,
    peerField: peer.fieldOfStudy?.trim() || "Résident",
    peerAvatarUrl: peer.avatarUrl ?? undefined,
    preview: last?.body ?? "Nouvelle conversation",
    updatedLabel: formatRelative(last?.createdAt ?? row.updatedAt),
    unread: row._count?.messages ?? 0,
  };
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const ctx = await getActiveStudentContext();
  if (!ctx) return [];

  const rows = await prisma.conversation.findMany({
    where: {
      residenceId: ctx.residenceId,
      OR: [{ userAId: ctx.session.userId }, { userBId: ctx.session.userId }],
    },
    include: conversationInclude,
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const withUnread = await Promise.all(
    rows.map(async (row) => {
      const lastRead = myLastRead(row, ctx.session.userId);
      const unread = await prisma.message.count({
        where: {
          conversationId: row.id,
          senderId: { not: ctx.session.userId },
          createdAt: { gt: lastRead },
        },
      });
      return mapSummary({ ...row, _count: { messages: unread } }, ctx.session.userId);
    }),
  );

  return withUnread;
}

export async function getConversation(
  conversationId: string,
): Promise<ConversationDetail | null> {
  const ctx = await getActiveStudentContext();
  if (!ctx) return null;

  const row = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      residenceId: ctx.residenceId,
      OR: [{ userAId: ctx.session.userId }, { userBId: ctx.session.userId }],
    },
    include: {
      userA: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fieldOfStudy: true,
          avatarUrl: true,
        },
      },
      userB: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fieldOfStudy: true,
          avatarUrl: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
      },
    },
  });

  if (!row) return null;

  const isUserA = row.userAId === ctx.session.userId;
  await prisma.conversation.update({
    where: { id: row.id },
    data: isUserA
      ? { userALastReadAt: new Date() }
      : { userBLastReadAt: new Date() },
  });

  const peer = peerOf(row, ctx.session.userId);
  const last = row.messages[row.messages.length - 1];

  return {
    id: row.id,
    peerId: peer.id,
    peerName: `${peer.firstName} ${peer.lastName}`,
    peerField: peer.fieldOfStudy?.trim() || "Résident",
    peerAvatarUrl: peer.avatarUrl ?? undefined,
    preview: last?.body ?? "Nouvelle conversation",
    updatedLabel: formatRelative(last?.createdAt ?? row.updatedAt),
    unread: 0,
    messages: row.messages.map((m) => ({
      id: m.id,
      fromMe: m.senderId === ctx.session.userId,
      text: m.body,
      timeLabel: formatMessageTime(m.createdAt),
    })),
  };
}

export async function ensureConversationWith(
  peerUserId: string,
): Promise<MessageActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }

  if (peerUserId === ctx.session.userId) {
    return { ok: false, error: "Tu ne peux pas t’écrire à toi-même." };
  }

  const peerMembership = await prisma.residenceMembership.findFirst({
    where: {
      userId: peerUserId,
      residenceId: ctx.residenceId,
      status: MembershipStatus.ACTIVE,
    },
  });

  if (!peerMembership) {
    return {
      ok: false,
      error: "Cette personne n’est pas un résident actif de ta résidence.",
    };
  }

  const [userAId, userBId] = orderedPair(ctx.session.userId, peerUserId);

  const existing = await prisma.conversation.findUnique({
    where: {
      residenceId_userAId_userBId: {
        residenceId: ctx.residenceId,
        userAId,
        userBId,
      },
    },
  });

  if (existing) {
    return { ok: true, conversationId: existing.id };
  }

  const created = await prisma.conversation.create({
    data: {
      residenceId: ctx.residenceId,
      userAId,
      userBId,
    },
  });

  return { ok: true, conversationId: created.id };
}

export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<MessageActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }

  const text = body.trim();
  if (!text) return { ok: false, error: "Écris un message." };
  if (text.length > 2000) {
    return { ok: false, error: "Message trop long (max 2000 caractères)." };
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      residenceId: ctx.residenceId,
      OR: [{ userAId: ctx.session.userId }, { userBId: ctx.session.userId }],
    },
  });

  if (!conversation) {
    return { ok: false, error: "Conversation introuvable." };
  }

  const message = await prisma.message.create({
    data: {
      body: text,
      conversationId: conversation.id,
      senderId: ctx.session.userId,
    },
  });

  const isUserA = conversation.userAId === ctx.session.userId;
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      updatedAt: new Date(),
      ...(isUserA
        ? { userALastReadAt: new Date() }
        : { userBLastReadAt: new Date() }),
    },
  });

  revalidatePath("/messages");

  return {
    ok: true,
    conversationId: conversation.id,
    message: {
      id: message.id,
      fromMe: true,
      text: message.body,
      timeLabel: formatMessageTime(message.createdAt),
    },
  };
}

async function assertConversationAccess(conversationId: string) {
  const ctx = await getActiveStudentContext();
  if (!ctx) return null;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      residenceId: ctx.residenceId,
      OR: [{ userAId: ctx.session.userId }, { userBId: ctx.session.userId }],
    },
  });

  if (!conversation) return null;
  return { ctx, conversation };
}

/** Supprime des messages sélectionnés (participant de la conversation). */
export async function deleteMessages(
  conversationId: string,
  messageIds: string[],
): Promise<MessageActionResult> {
  const access = await assertConversationAccess(conversationId);
  if (!access) {
    return { ok: false, error: "Conversation introuvable." };
  }

  const ids = [...new Set(messageIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    return { ok: false, error: "Sélectionne au moins un message." };
  }

  await prisma.message.deleteMany({
    where: {
      conversationId,
      id: { in: ids },
    },
  });

  const last = await prisma.message.findFirst({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: last?.createdAt ?? new Date() },
  });

  revalidatePath("/messages");
  return { ok: true, conversationId };
}

/** Efface toute la conversation (tous les messages). */
export async function clearConversation(
  conversationId: string,
): Promise<MessageActionResult> {
  const access = await assertConversationAccess(conversationId);
  if (!access) {
    return { ok: false, error: "Conversation introuvable." };
  }

  await prisma.message.deleteMany({
    where: { conversationId },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/messages");
  return { ok: true, conversationId };
}
