import { describe, expect, it } from "vitest";
import { normalizeAssetCode, WTI_CANONICAL_CODE } from "./assets";

describe("normalizeAssetCode", () => {
  it("normalizes WTI to canonical code", () => {
    expect(normalizeAssetCode("WTI")).toBe(WTI_CANONICAL_CODE);
  });

  it("keeps canonical WTI code stable", () => {
    expect(normalizeAssetCode("WTI_USD")).toBe(WTI_CANONICAL_CODE);
    expect(normalizeAssetCode("wti_usd")).toBe(WTI_CANONICAL_CODE);
  });

  it("uppercases non-WTI codes without remapping", () => {
    expect(normalizeAssetCode("brent")).toBe("BRENT");
    expect(normalizeAssetCode(" brent_usd ")).toBe("BRENT_USD");
  });
});
