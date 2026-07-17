import { describe, it, expect } from "vitest";
import { rank, isStaff, isManager, isAdmin } from "../lib/roles";

describe("hiérarchie des rôles", () => {
  it("rank ordonne les rôles", () => {
    expect(rank("TENANT")).toBe(0);
    expect(rank("MODERATOR")).toBe(1);
    expect(rank("SUBADMIN")).toBe(2);
    expect(rank("ADMIN")).toBe(3);
  });

  it("isStaff : modérateur et plus", () => {
    expect(isStaff("TENANT")).toBe(false);
    expect(isStaff("MODERATOR")).toBe(true);
    expect(isStaff("ADMIN")).toBe(true);
  });

  it("isManager : sous-admin et plus", () => {
    expect(isManager("MODERATOR")).toBe(false);
    expect(isManager("SUBADMIN")).toBe(true);
    expect(isManager("ADMIN")).toBe(true);
  });

  it("isAdmin : administrateur uniquement", () => {
    expect(isAdmin("SUBADMIN")).toBe(false);
    expect(isAdmin("ADMIN")).toBe(true);
  });
});
