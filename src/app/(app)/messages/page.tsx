import type { Metadata } from "next";
import { MessagesBoard } from "@/components/app/messages-board";
import {
  ensureConversationWith,
  getConversation,
  listConversations,
} from "@/lib/actions/messages";
import { requireActiveStudent } from "@/lib/student";

export const metadata: Metadata = {
  title: "Messages — Student-Connect",
  description:
    "Messagerie privée entre résidents de la même résidence.",
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  await requireActiveStudent();
  const params = await searchParams;

  let initialActiveId: string | null = null;
  let initialDetail = null;
  let bootstrapError: string | null = null;

  if (params.with) {
    const result = await ensureConversationWith(params.with);
    if (result.ok && result.conversationId) {
      initialActiveId = result.conversationId;
      initialDetail = await getConversation(result.conversationId);
    } else if (!result.ok) {
      bootstrapError = result.error;
    }
  }

  const conversations = await listConversations();

  return (
    <MessagesBoard
      initialConversations={conversations}
      initialActiveId={initialActiveId}
      initialDetail={initialDetail}
      bootstrapError={bootstrapError}
    />
  );
}
