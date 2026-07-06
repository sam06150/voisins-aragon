"use client";

import type { ComponentProps } from "react";

type ButtonVariant = "danger" | "ghost" | "neutral";

const variants: Record<ButtonVariant, string> = {
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-300",
  ghost: "bg-transparent text-red-600 hover:bg-red-50 focus:ring-red-200",
  neutral:
    "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 focus:ring-gray-200",
};

/**
 * Bouton de soumission avec confirmation navigateur, pour les actions
 * destructrices (suppressions, refus). Empêche les clics accidentels.
 */
export default function ConfirmButton({
  confirmMessage = "Confirmer cette action ?",
  variant = "danger",
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & {
  confirmMessage?: string;
  variant?: ButtonVariant;
}) {
  return (
    <button
      {...props}
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm outline-none transition focus:ring-2 disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
