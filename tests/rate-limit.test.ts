import { describe, it, expect, vi } from "vitest";
import { registerAttempt, registerSuccess } from "../lib/rate-limit";

// Clés uniques par test : le compteur est un Map partagé au niveau du module.
const k = () => `test-${Math.random().toString(36).slice(2)}`;

describe("registerAttempt", () => {
  it("autorise 5 tentatives puis bloque la 6e", () => {
    const key = k();
    for (let i = 0; i < 5; i++) {
      expect(registerAttempt(key).allowed).toBe(true);
    }
    const sixth = registerAttempt(key);
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfterSec).toBeGreaterThan(0);
  });

  it("reste bloqué tant que le blocage court", () => {
    const key = k();
    for (let i = 0; i < 6; i++) registerAttempt(key);
    expect(registerAttempt(key).allowed).toBe(false);
  });

  it("registerSuccess réinitialise le compteur", () => {
    const key = k();
    for (let i = 0; i < 4; i++) registerAttempt(key);
    registerSuccess(key);
    expect(registerAttempt(key).allowed).toBe(true);
  });

  it("repart à zéro après la fenêtre glissante", () => {
    vi.useFakeTimers();
    const key = k();
    for (let i = 0; i < 6; i++) registerAttempt(key);
    expect(registerAttempt(key).allowed).toBe(false);
    vi.advanceTimersByTime(16 * 60 * 1000); // > fenêtre (15 min) et blocage
    expect(registerAttempt(key).allowed).toBe(true);
    vi.useRealTimers();
  });
});
