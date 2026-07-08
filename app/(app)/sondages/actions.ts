"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isStaff } from "@/lib/roles";
import { pollSchema } from "@/lib/validation";
import { notifyResidents } from "@/lib/notifications";

export type PollFormState = { error?: string };

export async function createPoll(
  _prev: PollFormState,
  formData: FormData,
): Promise<PollFormState> {
  const user = await requireApproved();

  const options = formData
    .getAll("options")
    .map((o) => o.toString().trim())
    .filter(Boolean);

  const parsed = pollSchema.safeParse({
    question: formData.get("question")?.toString() ?? "",
    buildingId: formData.get("buildingId")?.toString() ?? "",
    options,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;

  const poll = await prisma.poll.create({
    data: {
      question: data.question,
      buildingId: data.buildingId ? data.buildingId : null,
      authorId: user.id,
      options: { create: data.options.map((label) => ({ label })) },
    },
  });

  await notifyResidents({
    type: "SONDAGE",
    message: `Nouveau sondage : « ${data.question} »`,
    link: `/sondages/${poll.id}`,
    buildingId: data.buildingId ? data.buildingId : null,
    excludeUserId: user.id,
  });

  revalidatePath("/sondages");
  redirect(`/sondages/${poll.id}`);
}

export async function votePoll(formData: FormData) {
  const user = await requireApproved();
  const pollId = formData.get("pollId")?.toString() ?? "";
  const optionId = formData.get("optionId")?.toString() ?? "";
  if (!pollId || !optionId) redirect("/sondages");

  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll || poll.closed) redirect(`/sondages/${pollId}`);

  const option = await prisma.pollOption.findFirst({
    where: { id: optionId, pollId },
  });
  if (!option) redirect(`/sondages/${pollId}`);

  await prisma.pollVote.upsert({
    where: { pollId_userId: { pollId, userId: user.id } },
    update: { optionId },
    create: { pollId, optionId, userId: user.id },
  });

  revalidatePath(`/sondages/${pollId}`);
  redirect(`/sondages/${pollId}`);
}

export async function closePoll(formData: FormData) {
  const user = await requireApproved();
  const pollId = formData.get("pollId")?.toString() ?? "";
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) redirect("/sondages");
  if (poll.authorId !== user.id && !isStaff(user.role)) {
    redirect(`/sondages/${pollId}`);
  }

  await prisma.poll.update({
    where: { id: pollId },
    data: { closed: !poll.closed },
  });

  revalidatePath(`/sondages/${pollId}`);
  redirect(`/sondages/${pollId}`);
}

/** Supprime un sondage (auteur ou staff). Options et votes supprimés en cascade. */
export async function deletePoll(formData: FormData) {
  const user = await requireApproved();
  const pollId = formData.get("pollId")?.toString() ?? "";
  if (!pollId) redirect("/sondages");

  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) redirect("/sondages");

  if (poll.authorId !== user.id && !isStaff(user.role)) {
    redirect(`/sondages/${pollId}?error=forbidden`);
  }

  await prisma.poll.delete({ where: { id: pollId } });

  revalidatePath("/sondages");
  redirect("/sondages");
}
