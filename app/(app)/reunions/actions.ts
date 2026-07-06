"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManager, requireApproved } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { meetingMinutesSchema, meetingSchema, rsvpSchema } from "@/lib/validation";
import { notifyResidents } from "@/lib/notifications";

export type MeetingFormState = { error?: string };

export async function createMeeting(
  _prev: MeetingFormState,
  formData: FormData,
): Promise<MeetingFormState> {
  const admin = await requireManager();

  const parsed = meetingSchema.safeParse({
    title: formData.get("title")?.toString() ?? "",
    scheduledAt: formData.get("scheduledAt")?.toString() ?? "",
    location: formData.get("location")?.toString() ?? "",
    agenda: formData.get("agenda")?.toString() ?? "",
    buildingId: formData.get("buildingId")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;

  const when = new Date(data.scheduledAt);
  if (Number.isNaN(when.getTime())) {
    return { error: "Date invalide." };
  }

  const meeting = await prisma.meeting.create({
    data: {
      title: data.title,
      scheduledAt: when,
      location: data.location ? data.location : null,
      agenda: data.agenda ? data.agenda : null,
      buildingId: data.buildingId ? data.buildingId : null,
      authorId: admin.id,
    },
  });

  await notifyResidents({
    type: "REUNION",
    message: `Nouvelle réunion : « ${data.title} »`,
    link: `/reunions/${meeting.id}`,
    buildingId: data.buildingId ? data.buildingId : null,
    excludeUserId: admin.id,
    email: true,
  });

  revalidatePath("/reunions");
  revalidatePath("/accueil");
  redirect(`/reunions/${meeting.id}`);
}

export async function updateMinutes(formData: FormData) {
  await requireManager();
  const meetingId = formData.get("meetingId")?.toString() ?? "";

  const parsed = meetingMinutesSchema.safeParse({
    minutesText: formData.get("minutesText")?.toString() ?? "",
  });
  if (!meetingId || !parsed.success) {
    redirect(`/reunions/${meetingId}?error=1`);
  }

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { minutesText: parsed.data.minutesText || null },
  });

  revalidatePath(`/reunions/${meetingId}`);
  redirect(`/reunions/${meetingId}?ok=1`);
}

export async function setRsvp(formData: FormData) {
  const user = await requireApproved();

  const parsed = rsvpSchema.safeParse({
    meetingId: formData.get("meetingId")?.toString() ?? "",
    status: formData.get("status")?.toString() ?? "",
  });
  if (!parsed.success) redirect("/reunions");

  await prisma.meetingRSVP.upsert({
    where: {
      meetingId_userId: {
        meetingId: parsed.data.meetingId,
        userId: user.id,
      },
    },
    update: { status: parsed.data.status },
    create: {
      meetingId: parsed.data.meetingId,
      userId: user.id,
      status: parsed.data.status,
    },
  });

  revalidatePath(`/reunions/${parsed.data.meetingId}`);
  redirect(`/reunions/${parsed.data.meetingId}`);
}

export async function deleteMeeting(formData: FormData) {
  await requireManager();
  const id = formData.get("meetingId")?.toString() ?? "";
  if (id) {
    // Détacher les documents liés avant suppression.
    await prisma.document.updateMany({
      where: { meetingId: id },
      data: { meetingId: null },
    });
    await prisma.meeting.delete({ where: { id } });
  }
  revalidatePath("/reunions");
  redirect("/reunions");
}
