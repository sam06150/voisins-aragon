"use server";

import { promises as fs } from "fs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isStaff } from "@/lib/roles";
import { documentMetaSchema } from "@/lib/validation";
import { ALLOWED_MIME, resolveUploadPath, saveUploadedFile } from "@/lib/storage";

const MAX_SIZE = 10 * 1024 * 1024;

export type DocumentFormState = { error?: string };

export async function createDocument(
  _prev: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const user = await requireApproved();

  const parsed = documentMetaSchema.safeParse({
    title: formData.get("title")?.toString() ?? "",
    category: formData.get("category")?.toString() ?? "",
    buildingId: formData.get("buildingId")?.toString() ?? "",
    meetingId: formData.get("meetingId")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Veuillez sélectionner un fichier." };
  }
  if (!ALLOWED_MIME[file.type]) {
    return { error: "Format non autorisé (JPEG, PNG, WEBP ou PDF)." };
  }
  if (file.size > MAX_SIZE) {
    return { error: "Fichier trop volumineux (10 Mo max)." };
  }

  const filePath = await saveUploadedFile(file, "documents");

  await prisma.document.create({
    data: {
      title: data.title,
      category: data.category,
      filePath,
      buildingId: data.buildingId ? data.buildingId : null,
      meetingId: data.meetingId ? data.meetingId : null,
      authorId: user.id,
    },
  });

  revalidatePath("/documents");
  if (data.meetingId) revalidatePath(`/reunions/${data.meetingId}`);
  redirect(data.meetingId ? `/reunions/${data.meetingId}` : "/documents");
}

export async function deleteDocument(formData: FormData) {
  const user = await requireApproved();
  const id = formData.get("documentId")?.toString() ?? "";
  if (!id) redirect("/documents");

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) redirect("/documents");

  // Seuls l'auteur ou un admin peuvent supprimer.
  if (doc.authorId !== user.id && !isStaff(user.role)) {
    redirect("/documents?error=forbidden");
  }

  await prisma.document.delete({ where: { id } });

  // Suppression du fichier sur disque (best effort).
  const absolute = resolveUploadPath(doc.filePath);
  if (absolute) {
    try {
      await fs.unlink(absolute);
    } catch {
      // fichier déjà absent : on ignore
    }
  }

  revalidatePath("/documents");
  redirect("/documents");
}
