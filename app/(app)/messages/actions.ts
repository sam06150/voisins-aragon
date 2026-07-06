"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { messageSchema } from "@/lib/validation";
import { notifyUser } from "@/lib/notifications";

export type MessageFormState = { error?: string };

export async function sendMessage(
  _prev: MessageFormState,
  formData: FormData,
): Promise<MessageFormState> {
  const user = await requireApproved();

  const parsed = messageSchema.safeParse({
    recipientId: formData.get("recipientId")?.toString() ?? "",
    body: formData.get("body")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const { recipientId, body } = parsed.data;

  if (recipientId === user.id) {
    return { error: "Vous ne pouvez pas vous écrire à vous-même." };
  }

  const recipient = await prisma.user.findFirst({
    where: { id: recipientId, status: "APPROVED" },
  });
  if (!recipient) {
    return { error: "Destinataire introuvable." };
  }

  await prisma.privateMessage.create({
    data: { senderId: user.id, recipientId, body },
  });

  await notifyUser({
    userId: recipientId,
    type: "MESSAGE",
    message: `Nouveau message de ${user.firstName} ${user.lastName}`,
    link: `/messages/${user.id}`,
    email: true,
  });

  revalidatePath(`/messages/${recipientId}`);
  redirect(`/messages/${recipientId}`);
}

/** Envoi rapide depuis une conversation (form simple, sans useActionState). */
export async function replyMessage(formData: FormData) {
  const user = await requireApproved();
  const recipientId = formData.get("recipientId")?.toString() ?? "";
  const body = formData.get("body")?.toString().trim() ?? "";

  if (!recipientId || !body) redirect(`/messages/${recipientId}`);
  if (recipientId === user.id) redirect("/messages");

  const recipient = await prisma.user.findFirst({
    where: { id: recipientId, status: "APPROVED" },
  });
  if (!recipient) redirect("/messages");

  await prisma.privateMessage.create({
    data: { senderId: user.id, recipientId, body: body.slice(0, 5000) },
  });

  await notifyUser({
    userId: recipientId,
    type: "MESSAGE",
    message: `Nouveau message de ${user.firstName} ${user.lastName}`,
    link: `/messages/${user.id}`,
    email: true,
  });

  revalidatePath(`/messages/${recipientId}`);
  redirect(`/messages/${recipientId}#bas`);
}
