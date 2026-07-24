import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// text-base + py-2.5 : lisibilité et cible tactile pour un public âgé (WCAG 1.4.4 / 2.5.5).
export const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 shadow-sm outline-none transition focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-60";

export const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={`${inputClass} min-h-28 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  return (
    <select {...props} className={`${inputClass} ${props.className ?? ""}`} />
  );
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600",
  secondary:
    "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-500",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants[variant]} ${className}`}
    />
  );
}

export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 ${buttonVariants[variant]} ${className}`}
    />
  );
}

export function Alert({
  kind = "info",
  children,
}: {
  kind?: "info" | "error" | "success" | "warning";
  children: ReactNode;
}) {
  const styles: Record<string, string> = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    error: "bg-red-50 text-red-800 border-red-200",
    success: "bg-green-50 text-green-800 border-green-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
  };
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm ${styles[kind]}`}
    >
      {children}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 px-6 py-12 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}
