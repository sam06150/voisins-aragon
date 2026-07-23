import { describe, it, expect } from "vitest";
import {
  scopeFor,
  buildingScopeWhere,
  optionalBuildingScopeWhere,
  userScopeWhere,
} from "../lib/tenancy";

const RES = "res_123";

describe("cloisonnement multi-résidences", () => {
  it("un compte sans résidence a une portée globale (mode mono-résidence)", () => {
    const scope = scopeFor({ residenceId: null });
    expect(scope).toEqual({ kind: "global" });
    // Portée globale = aucun filtre : comportement historique inchangé.
    expect(buildingScopeWhere(scope)).toEqual({});
    expect(optionalBuildingScopeWhere(scope)).toEqual({});
    expect(userScopeWhere(scope)).toEqual({});
  });

  it("un compte rattaché est borné à sa résidence", () => {
    const scope = scopeFor({ residenceId: RES });
    expect(scope).toEqual({ kind: "residence", residenceId: RES });
  });

  it("les modèles à bâtiment obligatoire filtrent par la résidence du bâtiment", () => {
    const scope = scopeFor({ residenceId: RES });
    expect(buildingScopeWhere(scope)).toEqual({
      building: { residenceId: RES },
    });
  });

  it("les modèles à bâtiment optionnel gardent le contenu général visible", () => {
    const scope = scopeFor({ residenceId: RES });
    // buildingId null (contenu « général ») OU bâtiment de la résidence.
    expect(optionalBuildingScopeWhere(scope)).toEqual({
      OR: [{ buildingId: null }, { building: { residenceId: RES } }],
    });
  });

  it("les comptes sont filtrés par residenceId", () => {
    const scope = scopeFor({ residenceId: RES });
    expect(userScopeWhere(scope)).toEqual({ residenceId: RES });
  });
});
