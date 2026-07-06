import type {
  IncidentCategory,
  IncidentStatus,
  DocumentCategory,
  LandlordStepType,
  RsvpStatus,
  HelpType,
  Role,
} from "@prisma/client";

export const roleLabels: Record<Role, string> = {
  TENANT: "Locataire",
  MODERATOR: "Modérateur",
  SUBADMIN: "Sous-admin",
  ADMIN: "Administrateur",
};

export const incidentCategoryLabels: Record<IncidentCategory, string> = {
  REPARATION: "Réparation",
  DEGRADATION: "Dégradation",
  LITIGE_BAILLEUR: "Litige bailleur",
  NUISANCE: "Nuisance",
  SECURITE: "Sécurité",
  AUTRE: "Autre",
};

export const incidentStatusLabels: Record<IncidentStatus, string> = {
  OUVERT: "Ouvert",
  EN_COURS: "En cours",
  RESOLU: "Résolu",
  CLOS: "Clos",
};

export const incidentStatusColors: Record<IncidentStatus, string> = {
  OUVERT: "bg-red-100 text-red-800 border-red-200",
  EN_COURS: "bg-amber-100 text-amber-800 border-amber-200",
  RESOLU: "bg-green-100 text-green-800 border-green-200",
  CLOS: "bg-gray-100 text-gray-700 border-gray-200",
};

export const documentCategoryLabels: Record<DocumentCategory, string> = {
  MODELE_LETTRE: "Modèle de lettre",
  PETITION: "Pétition",
  PREUVE: "Preuve / justificatif",
  COMPTE_RENDU: "Compte-rendu",
  AUTRE: "Autre",
};

export const landlordStepLabels: Record<LandlordStepType, string> = {
  COURRIER: "Courrier envoyé",
  RELANCE: "Relance",
  REPONSE: "Réponse reçue",
  RENDEZVOUS: "Rendez-vous",
  ACTION: "Action collective",
  AUTRE: "Autre",
};

export const landlordStepColors: Record<LandlordStepType, string> = {
  COURRIER: "bg-blue-100 text-blue-800 border-blue-200",
  RELANCE: "bg-amber-100 text-amber-800 border-amber-200",
  REPONSE: "bg-green-100 text-green-800 border-green-200",
  RENDEZVOUS: "bg-purple-100 text-purple-800 border-purple-200",
  ACTION: "bg-rose-100 text-rose-800 border-rose-200",
  AUTRE: "bg-gray-100 text-gray-700 border-gray-200",
};

export const rsvpLabels: Record<RsvpStatus, string> = {
  OUI: "Présent",
  NON: "Absent",
  PEUTETRE: "Peut-être",
};

export const helpTypeLabels: Record<HelpType, string> = {
  OFFRE: "Je propose",
  DEMANDE: "Je cherche",
};

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
});
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
});

export function formatDate(d: Date | string): string {
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string): string {
  return dateTimeFmt.format(new Date(d));
}
