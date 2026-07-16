import { z } from "zod";

export const incidentCategories = [
  "REPARATION",
  "DEGRADATION",
  "LITIGE_BAILLEUR",
  "NUISANCE",
  "SECURITE",
  "AUTRE",
] as const;

export const incidentStatuses = [
  "OUVERT",
  "EN_COURS",
  "RESOLU",
  "CLOS",
] as const;

export const documentCategories = [
  "MODELE_LETTRE",
  "PETITION",
  "PREUVE",
  "COMPTE_RENDU",
  "AUTRE",
] as const;

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(60),
  lastName: z.string().trim().min(1, "Nom requis").max(60),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  residenceName: z.string().trim().max(80).optional().or(z.literal("")),
  buildingId: z.string().trim().min(1, "Sélectionnez votre bâtiment"),
  unitLabel: z.string().trim().min(1, "Indiquez votre étage / appartement").max(60),
});

export const loginSchema = z.object({
  // Identifiant : e-mail (locataires) OU nom d'utilisateur (comptes internes).
  email: z.string().trim().toLowerCase().min(1, "Identifiant requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z
      .string()
      .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères")
      .max(200),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les deux mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const adminResetPasswordSchema = z.object({
  userId: z.string().trim().min(1),
  newPassword: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(200),
});

export const promoteSchema = z.object({
  userId: z.string().trim().min(1),
  role: z.enum(["TENANT", "MODERATOR", "SUBADMIN", "ADMIN"]),
});

export const directoryPrefsSchema = z.object({
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  shareInDirectory: z.boolean(),
  shareEmail: z.boolean(),
  sharePhone: z.boolean(),
});

export const incidentSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court").max(140),
  description: z.string().trim().min(5, "Description trop courte").max(5000),
  category: z.enum(incidentCategories),
  buildingId: z.string().trim().min(1, "Bâtiment requis"),
  unitId: z.string().trim().optional().or(z.literal("")),
});

export const incidentStatusSchema = z.object({
  status: z.enum(incidentStatuses),
});

export const threadSchema = z.object({
  categoryId: z.string().trim().min(1, "Catégorie requise"),
  title: z.string().trim().min(3, "Titre trop court").max(140),
  body: z.string().trim().min(1, "Message requis").max(5000),
});

export const postSchema = z.object({
  threadId: z.string().trim().min(1),
  body: z.string().trim().min(1, "Message requis").max(5000),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court").max(140),
  body: z.string().trim().min(1, "Contenu requis").max(5000),
  buildingId: z.string().trim().optional().or(z.literal("")),
  pinned: z.boolean().optional().default(false),
});

export const meetingSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court").max(140),
  scheduledAt: z.string().trim().min(1, "Date requise"),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  agenda: z.string().trim().max(5000).optional().or(z.literal("")),
  buildingId: z.string().trim().optional().or(z.literal("")),
});

export const meetingMinutesSchema = z.object({
  minutesText: z.string().trim().max(10000).optional().or(z.literal("")),
});

export const documentMetaSchema = z.object({
  title: z.string().trim().min(2, "Titre trop court").max(140),
  category: z.enum(documentCategories),
  buildingId: z.string().trim().optional().or(z.literal("")),
  meetingId: z.string().trim().optional().or(z.literal("")),
});

export const approveAccountSchema = z.object({
  action: z.enum(["approve", "reject"]),
  unitId: z.string().trim().optional().or(z.literal("")),
});

export const landlordStepTypes = [
  "COURRIER",
  "RELANCE",
  "REPONSE",
  "RENDEZVOUS",
  "ACTION",
  "AUTRE",
] as const;

export const petitionSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court").max(140),
  description: z.string().trim().min(10, "Description trop courte").max(5000),
  buildingId: z.string().trim().optional().or(z.literal("")),
  goal: z.string().trim().optional().or(z.literal("")),
});

export const pollSchema = z.object({
  question: z.string().trim().min(3, "Question trop courte").max(200),
  buildingId: z.string().trim().optional().or(z.literal("")),
  options: z
    .array(z.string().trim().min(1))
    .min(2, "Au moins 2 options")
    .max(10, "10 options maximum"),
});

export const landlordStepSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court").max(200),
  detail: z.string().trim().max(5000).optional().or(z.literal("")),
  type: z.enum(landlordStepTypes),
  occurredAt: z.string().trim().min(1, "Date requise"),
  buildingId: z.string().trim().optional().or(z.literal("")),
});

export const helpOfferSchema = z.object({
  type: z.enum(["OFFRE", "DEMANDE"]),
  title: z.string().trim().min(3, "Titre trop court").max(140),
  description: z.string().trim().min(3, "Description trop courte").max(3000),
  buildingId: z.string().trim().optional().or(z.literal("")),
});

export const messageSchema = z.object({
  recipientId: z.string().trim().min(1, "Destinataire requis"),
  body: z.string().trim().min(1, "Message vide").max(5000),
});

export const rsvpSchema = z.object({
  meetingId: z.string().trim().min(1),
  status: z.enum(["OUI", "NON", "PEUTETRE"]),
});
