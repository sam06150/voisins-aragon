import { describe, it, expect } from "vitest";
import {
  resolveUploadPath,
  contentTypeForPath,
  publicFileUrl,
  hasValidMagicBytes,
} from "../lib/storage";

describe("resolveUploadPath (anti path-traversal)", () => {
  it("bloque les sorties du dossier uploads", () => {
    expect(resolveUploadPath("../../etc/passwd")).toBeNull();
    expect(resolveUploadPath("..")).toBeNull();
    expect(resolveUploadPath("sub/../../secret")).toBeNull();
  });

  it("accepte un sous-chemin valide", () => {
    const p = resolveUploadPath("incidents/abc.png");
    expect(p).not.toBeNull();
    expect(p).toContain("uploads");
  });
});

describe("hasValidMagicBytes", () => {
  it("valide les bons octets d'en-tête", () => {
    expect(hasValidMagicBytes(Buffer.from([0xff, 0xd8, 0xff, 0x00]), "image/jpeg")).toBe(true);
    expect(hasValidMagicBytes(Buffer.from([0x89, 0x50, 0x4e, 0x47]), "image/png")).toBe(true);
    expect(hasValidMagicBytes(Buffer.from("RIFF0000WEBP"), "image/webp")).toBe(true);
    expect(hasValidMagicBytes(Buffer.from("%PDF-1.7"), "application/pdf")).toBe(true);
  });

  it("rejette un contenu qui ne correspond pas au type", () => {
    expect(hasValidMagicBytes(Buffer.from([0x00, 0x00, 0x00, 0x00]), "image/png")).toBe(false);
    expect(hasValidMagicBytes(Buffer.from([0xff]), "image/jpeg")).toBe(false);
    expect(hasValidMagicBytes(Buffer.from([0xff, 0xd8, 0xff]), "application/zip")).toBe(false);
  });
});

describe("contentTypeForPath", () => {
  it("mappe les extensions connues", () => {
    expect(contentTypeForPath("x/a.jpg")).toBe("image/jpeg");
    expect(contentTypeForPath("a.jpeg")).toBe("image/jpeg");
    expect(contentTypeForPath("a.png")).toBe("image/png");
    expect(contentTypeForPath("a.pdf")).toBe("application/pdf");
    expect(contentTypeForPath("a.inconnu")).toBe("application/octet-stream");
  });
});

describe("publicFileUrl", () => {
  it("garde les URLs http et préfixe les chemins locaux", () => {
    expect(publicFileUrl("https://res.cloudinary.com/x/y.png")).toBe(
      "https://res.cloudinary.com/x/y.png",
    );
    expect(publicFileUrl("incidents/f.png")).toBe("/api/uploads/incidents/f.png");
  });
});
