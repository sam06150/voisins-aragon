"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { landlordStepSchema } from "@/lib/validation";

export type StepFormState = { error?: string };

export async function createStep(
  _prev: StepFormState,
  formData: FormData,
): Promise<StepFormState> {
  const admin = await requireManager();

  const parsed = landlordStepSchema.safeParse({
    title: formData.get("title")?.toString() ?? "",
    detail: formData.get("detail")?.toString() ?? "",
    type: formData.get("type")?.toString() ?? "",
    occurredAt: formData.get("occurredAt")?.toString() ?? "",
    buildingId: formData.get("buildingId")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;

  const when = new Date(data.occurredAt);
  if (Number.isNaN(when.getTime())) return { error: "Date invalide." };

  await prisma.landlordStep.create({
    data: {
      title: data.title,
      detail: data.detail ? data.detail : null,
      type: data.type,
      occurredAt: when,
      buildingId: data.buildingId ? data.buildingId : null,
      authorId: admin.id,
    },
  });

  revalidatePath("/demarches");
  redirect("/demarches");
}

export async function deleteStep(formData: FormData) {
  await requireManager();
  const id = formData.get("stepId")?.toString() ?? "";
  if (id) await prisma.landlordStep.delete({ where: { id } });
  revalidatePath("/demarches");
  redirect("/demarches");
}
