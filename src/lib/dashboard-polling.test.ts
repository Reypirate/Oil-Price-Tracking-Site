import { describe, expect, it } from "vitest";
import { shouldDashboardPoll } from "./dashboard-polling";

describe("shouldDashboardPoll", () => {
  it("allows polling when tab is visible", () => {
    expect(shouldDashboardPoll("visible")).toBe(true);
  });

  it("pauses polling when tab is not visible", () => {
    expect(shouldDashboardPoll("hidden")).toBe(false);
  });
});
