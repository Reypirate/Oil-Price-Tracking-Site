export const WTI_CANONICAL_CODE = "WTI_USD";

export function normalizeAssetCode(assetCode: string): string {
  const normalized = assetCode.trim().toUpperCase();

  if (normalized === "WTI" || normalized === WTI_CANONICAL_CODE) {
    return WTI_CANONICAL_CODE;
  }

  return normalized;
}
