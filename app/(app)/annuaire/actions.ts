"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { directoryPrefsSchema } from "@/lib/validation";

export async function updateDirectoryPrefs(formData: FormData) {
  const user = await requireApproved();

  const parsed = directoryPrefsSchema.safeParse({
    phone: formData.get("phone")?.toString() ?? "",
    shareInDirectory: formData.get("shareInDirectory") === "on",
    shareEmail: formData.get("shareEmail") === "on",
    sharePhone: formData.get("sharePhone") === "on",
  });

  if (!parsed.success) {
    redirect("/annuaire/moi?error=1");
  }
  const data = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      phone: data.phone ? data.phone : null,
      shareInDirectory: data.shareInDirectory,
      shareEmail: data.shareEmail,
      sharePhone: data.sharePhone,
    },
  });

  revalidatePath("/annuaire");
  revalidatePath("/annuaire/moi");
  redirect("/annuaire/moi?ok=1");
}
