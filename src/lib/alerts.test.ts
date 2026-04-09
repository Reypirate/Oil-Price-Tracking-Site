import { beforeEach, describe, expect, it, vi } from "vitest";
import { processAlerts } from "./alerts";
import type { OilPriceData } from "./oil-api";
import * as supabaseModule from "./supabase";

type FilterCall = {
  column: string;
  op: "eq" | "is" | "lte" | "gte" | "in";
  value: unknown;
};

type QueryCall = {
  columns?: string;
  filters: FilterCall[];
  kind: "select" | "update";
  payload?: Record<string, unknown>;
  table: string;
};

function createSupabaseMock({
  aboveRows,
  belowRows,
  updatedRows,
}: {
  aboveRows: Array<{ id: string }>;
  belowRows: Array<{ id: string }>;
  updatedRows: Array<{ id: string }>;
}) {
  const calls: QueryCall[] = [];

  const supabase = {
    from: (table: string) => ({
      select: (columns: string) => {
        const call: QueryCall = {
          kind: "select",
          table,
          columns,
          filters: [],
        };
        calls.push(call);

        const query = {
          eq: (column: string, value: unknown) => {
            call.filters.push({ column, op: "eq", value });
            return query;
          },
          gte: (column: string, value: unknown) => {
            call.filters.push({ column, op: "gte", value });
            return Promise.resolve({ data: belowRows, error: null });
          },
          is: (column: string, value: unknown) => {
            call.filters.push({ column, op: "is", value });
            return query;
          },
          lte: (column: string, value: unknown) => {
            call.filters.push({ column, op: "lte", value });
            return Promise.resolve({ data: aboveRows, error: null });
          },
        };

        return query;
      },
      update: (payload: Record<string, unknown>) => {
        const call: QueryCall = {
          kind: "update",
          table,
          filters: [],
          payload,
        };
        calls.push(call);

        const query = {
          eq: (column: string, value: unknown) => {
            call.filters.push({ column, op: "eq", value });
            return query;
          },
          in: (column: string, value: unknown) => {
            call.filters.push({ column, op: "in", value });
            return query;
          },
          is: (column: string, value: unknown) => {
            call.filters.push({ column, op: "is", value });
            return query;
          },
          select: (columns: string) => {
            call.columns = columns;
            return Promise.resolve({ data: updatedRows, error: null });
          },
        };

        return query;
      },
    }),
  };

  return { calls, supabase };
}

describe("processAlerts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("matches in DB, deactivates triggered alerts once, and returns aggregate details", async () => {
    const { calls, supabase } = createSupabaseMock({
      aboveRows: [{ id: "a1" }],
      belowRows: [{ id: "b2" }],
      updatedRows: [{ id: "a1" }, { id: "b2" }],
    });
    vi.spyOn(supabaseModule, "getSupabaseAdmin").mockReturnValue(supabase as never);

    const priceData: OilPriceData = {
      code: "WTI",
      currency: "USD",
      price: 80,
      timestamp: "2026-04-09T00:00:00Z",
    };

    const result = await processAlerts(priceData);

    expect(result).toEqual({
      assetCode: "WTI_USD",
      matched: 2,
      updated: 2,
      triggeredIds: ["a1", "b2"],
    });

    const selectCalls = calls.filter((call) => call.kind === "select");
    expect(selectCalls).toHaveLength(2);
    for (const call of selectCalls) {
      expect(call.columns).toContain("id");
      expect(call.columns).not.toContain("*");
      expect(call.filters).toEqual(
        expect.arrayContaining([
          { column: "asset_code", op: "eq", value: "WTI_USD" },
          { column: "is_active", op: "eq", value: true },
          { column: "triggered_at", op: "is", value: null },
        ]),
      );
    }

    expect(selectCalls[0].filters).toEqual(
      expect.arrayContaining([
        { column: "condition", op: "eq", value: "above" },
        { column: "threshold_price", op: "lte", value: 80 },
      ]),
    );
    expect(selectCalls[1].filters).toEqual(
      expect.arrayContaining([
        { column: "condition", op: "eq", value: "below" },
        { column: "threshold_price", op: "gte", value: 80 },
      ]),
    );

    const updateCall = calls.find((call) => call.kind === "update");
    expect(updateCall).toBeDefined();
    expect(updateCall?.payload).toEqual({
      is_active: false,
      triggered_at: expect.any(String),
    });
    expect(updateCall?.filters).toEqual(
      expect.arrayContaining([
        { column: "id", op: "in", value: ["a1", "b2"] },
        { column: "is_active", op: "eq", value: true },
        { column: "triggered_at", op: "is", value: null },
      ]),
    );
  });

  it("is idempotent when no untriggered alerts match", async () => {
    const { calls, supabase } = createSupabaseMock({
      aboveRows: [],
      belowRows: [],
      updatedRows: [],
    });
    vi.spyOn(supabaseModule, "getSupabaseAdmin").mockReturnValue(supabase as never);

    const result = await processAlerts({
      code: "WTI_USD",
      currency: "USD",
      price: 70,
      timestamp: "2026-04-09T00:00:00Z",
    });

    expect(result).toEqual({
      assetCode: "WTI_USD",
      matched: 0,
      updated: 0,
      triggeredIds: [],
    });

    expect(calls.some((call) => call.kind === "update")).toBe(false);
  });
});
