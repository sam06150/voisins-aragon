"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, requireApproved } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isStaff } from "@/lib/roles";
import { scopeFor, optionalBuildingScopeWhere } from "@/lib/tenancy";
import { postSchema, threadSchema } from "@/lib/validation";
import { notifyResidents } from "@/lib/notifications";

export type ThreadFormState = { error?: string };

export async function createThread(
  _prev: ThreadFormState,
  formData: FormData,
): Promise<ThreadFormState> {
  const user = await requireApproved();

  const parsed = threadSchema.safeParse({
    categoryId: formData.get("categoryId")?.toString() ?? "",
    title: formData.get("title")?.toString() ?? "",
    body: formData.get("body")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;

  const category = await prisma.forumCategory.findFirst({
    where: { AND: [optionalBuildingScopeWhere(scopeFor(user)), { id: data.categoryId }] },
  });
  if (!category) return { error: "Catégorie hors de votre résidence." };

  const thread = await prisma.forumThread.create({
    data: {
      categoryId: data.categoryId,
      title: data.title,
      authorId: user.id,
      posts: { create: { body: data.body, authorId: user.id } },
    },
  });

  await notifyResidents({
    type: "FORUM",
    message: `Nouvelle discussion : « ${data.title} »`,
    link: `/forum/${data.categoryId}/${thread.id}`,
    buildingId: category.buildingId,
    residenceId: user.residenceId, // cloisonnement
    excludeUserId: user.id,
  });

  revalidatePath(`/forum/${data.categoryId}`);
  redirect(`/forum/${data.categoryId}/${thread.id}`);
}

/** Charge un fil borné à la résidence de l'utilisateur (null si hors périmètre). */
function findThreadInScope(
  user: { residenceId: string | null },
  threadId: string,
) {
  return prisma.forumThread.findFirst({
    where: {
      AND: [{ category: optionalBuildingScopeWhere(scopeFor(user)) }, { id: threadId }],
    },
  });
}

export async function createPost(formData: FormData) {
  const user = await requireApproved();
  const threadId = formData.get("threadId")?.toString() ?? "";

  const thread = await findThreadInScope(user, threadId);
  if (!thread) redirect("/forum");

  const parsed = postSchema.safeParse({
    threadId,
    body: formData.get("body")?.toString() ?? "",
  });
  if (!parsed.success) {
    redirect(`/forum/${thread.categoryId}/${threadId}`);
  }

  if (thread.isLocked && !isStaff(user.role)) {
    redirect(`/forum/${thread.categoryId}/${threadId}?error=locked`);
  }

  await prisma.forumPost.create({
    data: { threadId, body: parsed.data.body, authorId: user.id },
  });
  await prisma.forumThread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() },
  });

  revalidatePath(`/forum/${thread.categoryId}/${threadId}`);
  redirect(`/forum/${thread.categoryId}/${threadId}#bas`);
}

export async function toggleThreadLock(formData: FormData) {
  const staff = await requireStaff();
  const threadId = formData.get("threadId")?.toString() ?? "";
  const thread = await findThreadInScope(staff, threadId);
  if (!thread) redirect("/forum");

  await prisma.forumThread.update({
    where: { id: threadId },
    data: { isLocked: !thread.isLocked },
  });
  revalidatePath(`/forum/${thread.categoryId}/${threadId}`);
  redirect(`/forum/${thread.categoryId}/${threadId}`);
}

export async function deleteThread(formData: FormData) {
  const staff = await requireStaff();
  const threadId = formData.get("threadId")?.toString() ?? "";
  const thread = await findThreadInScope(staff, threadId);
  if (!thread) redirect("/forum");

  await prisma.forumThread.delete({ where: { id: threadId } });
  revalidatePath(`/forum/${thread.categoryId}`);
  redirect(`/forum/${thread.categoryId}`);
}

export async function deletePost(formData: FormData) {
  const staff = await requireStaff();
  const postId = formData.get("postId")?.toString() ?? "";
  const post = await prisma.forumPost.findFirst({
    where: {
      AND: [
        { thread: { category: optionalBuildingScopeWhere(scopeFor(staff)) } },
        { id: postId },
      ],
    },
    include: { thread: true },
  });
  if (!post) redirect("/forum");

  await prisma.forumPost.delete({ where: { id: postId } });
  revalidatePath(`/forum/${post.thread.categoryId}/${post.threadId}`);
  redirect(`/forum/${post.thread.categoryId}/${post.threadId}`);
}
