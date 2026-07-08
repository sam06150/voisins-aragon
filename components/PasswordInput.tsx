"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import { inputClass } from "./ui";

/**
 * Champ mot de passe avec un bouton "œil" pour afficher/masquer la saisie,
 * afin de vérifier qu'on ne se trompe pas en tapant.
 */
export default function PasswordInput({
  className = "",
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`${inputClass} pr-11 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-lg text-gray-400 hover:text-gray-700"
      >
        {show ? "🙈" : "👁️"}
      </button>
    </div>
  );
}
