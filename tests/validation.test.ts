import { describe, it, expect } from "vitest";
import { signupSchema, changePasswordSchema } from "../lib/validation";

const base = {
  firstName: "Jean",
  lastName: "Dupont",
  email: "JEAN@EXEMPLE.FR",
  password: "motdepasse",
  unitLabel: "3B",
  consent: true as const,
};

describe("signupSchema", () => {
  it("accepte un bâtiment sélectionné (buildingId seul)", () => {
    expect(signupSchema.safeParse({ ...base, buildingId: "b1" }).success).toBe(true);
  });

  it("accepte un bâtiment tapé (buildingName seul)", () => {
    expect(signupSchema.safeParse({ ...base, buildingName: "Bâtiment Z" }).success).toBe(true);
  });

  it("refuse quand ni bâtiment ni nom ne sont fournis", () => {
    expect(signupSchema.safeParse({ ...base }).success).toBe(false);
  });

  it("met l'e-mail en minuscules", () => {
    const r = signupSchema.safeParse({ ...base, buildingId: "b1" });
    expect(r.success && r.data.email).toBe("jean@exemple.fr");
  });

  it("refuse un mot de passe trop court", () => {
    expect(
      signupSchema.safeParse({ ...base, buildingId: "b1", password: "court" }).success,
    ).toBe(false);
  });

  it("refuse sans consentement", () => {
    expect(
      signupSchema.safeParse({ ...base, buildingId: "b1", consent: false }).success,
    ).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("refuse si la confirmation diffère", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "x",
        newPassword: "abcdefgh",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
  });

  it("accepte si identiques et >= 8 caractères", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "x",
        newPassword: "abcdefgh",
        confirmPassword: "abcdefgh",
      }).success,
    ).toBe(true);
  });
});
