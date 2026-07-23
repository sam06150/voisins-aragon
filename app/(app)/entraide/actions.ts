"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isStaff } from "@/lib/roles";
import {
  scopeFor,
  optionalBuildingScopeWhere,
  assertBuildingInScope,
} from "@/lib/tenancy";
import { helpOfferSchema } from "@/lib/validation";

export type HelpFormState = { error?: string };

export async function createHelpOffer(
  _prev: HelpFormState,
  formData: FormData,
): Promise<HelpFormState> {
  const user = await requireApproved();

  const parsed = helpOfferSchema.safeParse({
    type: formData.get("type")?.toString() ?? "",
    title: formData.get("title")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    buildingId: formData.get("buildingId")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;

  try {
    await assertBuildingInScope(scopeFor(user), data.buildingId || null);
  } catch {
    return { error: "Bâtiment hors de votre résidence." };
  }

  await prisma.helpOffer.create({
    data: {
      type: data.type,
      title: data.title,
      description: data.description,
      buildingId: data.buildingId ? data.buildingId : null,
      authorId: user.id,
    },
  });

  revalidatePath("/entraide");
  redirect("/entraide");
}

export async function toggleResolved(formData: FormData) {
  const user = await requireApproved();
  const id = formData.get("offerId")?.toString() ?? "";
  const offer = await prisma.helpOffer.findFirst({
    where: { AND: [optionalBuildingScopeWhere(scopeFor(user)), { id }] },
  });
  if (!offer) redirect("/entraide");
  if (offer.authorId !== user.id && !isStaff(user.role)) {
    redirect("/entraide");
  }

  await prisma.helpOffer.update({
    where: { id },
    data: { resolved: !offer.resolved },
  });
  revalidatePath("/entraide");
  redirect("/entraide");
}

export async function deleteHelpOffer(formData: FormData) {
  const user = await requireApproved();
  const id = formData.get("offerId")?.toString() ?? "";
  const offer = await prisma.helpOffer.findFirst({
    where: { AND: [optionalBuildingScopeWhere(scopeFor(user)), { id }] },
  });
  if (!offer) redirect("/entraide");
  if (offer.authorId !== user.id && !isStaff(user.role)) {
    redirect("/entraide");
  }

  await prisma.helpOffer.delete({ where: { id } });
  revalidatePath("/entraide");
  redirect("/entraide");
}
