export const EXCHANGE_RATES = {
  USD_TO_PHP: 56.5,
  USD_TO_SGD: 1.35,
};

/** 1 US gallon = 3.78541 liters */
const GALLONS_TO_LITERS = 3.78541;

/**
 * Normalizes a global USD barrel price into regional pump-price approximations.
 * Note: These are 'simulated' pump prices based on regional coefficients.
 */
export function getRegionalPrice(usdPrice: number, region: "PH" | "SG") {
  if (region === "PH") {
    return usdPrice * EXCHANGE_RATES.USD_TO_PHP + 15 + 5;
  }
  if (region === "SG") {
    return usdPrice * EXCHANGE_RATES.USD_TO_SGD + 0.4 + 0.6;
  }
  return usdPrice;
}

/**
 * Converts a USD/gallon wholesale price to an estimated retail per-liter price
 * in the given region's local currency.
 *
 * Markup assumptions (based on April 2026 market data):
 *   SG: ~SGD 1.20/L distribution + taxes + station margin
 *   PH: ~₱18/L TRAIN taxes + distribution + station margin
 */
export function getDieselPerLiter(usdPerGallon: number, region: "PH" | "SG"): number {
  const usdPerLiter = usdPerGallon / GALLONS_TO_LITERS;

  if (region === "SG") {
    // Convert to SGD, then add duty + carbon tax + station margin
    // Approximate retail formula: base * FX * 1.25 (refining) + 1.20 (logistics+tax)
    return usdPerLiter * EXCHANGE_RATES.USD_TO_SGD * 1.25 + 1.2;
  }

  if (region === "PH") {
    // Convert to PHP, then add TRAIN tax + logistics + station margin
    // Approximate retail formula: base * FX * 1.20 (refining) + 18 (taxes+logistics)
    return usdPerLiter * EXCHANGE_RATES.USD_TO_PHP * 1.2 + 18;
  }

  return usdPerLiter;
}

export function formatCurrency(amount: number, currency: "PHP" | "SGD" | "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
