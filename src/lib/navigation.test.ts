import { describe, expect, it } from "vitest";
import { getActivePrimaryNav } from "./navigation";

describe("getActivePrimaryNav", () => {
  it("marks dashboard as active on root route", () => {
    expect(getActivePrimaryNav("/")).toBe("dashboard");
  });

  it("marks alerts as active on alerts routes", () => {
    expect(getActivePrimaryNav("/alerts")).toBe("alerts");
    expect(getActivePrimaryNav("/alerts/history")).toBe("alerts");
  });

  it("returns null for non-primary routes", () => {
    expect(getActivePrimaryNav("/settings")).toBeNull();
  });
});
