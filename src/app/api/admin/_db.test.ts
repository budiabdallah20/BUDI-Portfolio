import { beforeEach, describe, expect, it, vi } from "vitest";

const { upsert } = vi.hoisted(() => ({ upsert: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  supabaseService: () => ({ from: () => ({ upsert }) }),
}));

import { upsertResilient } from "./_db";

const err = (message: string) => ({ error: { message } });

describe("upsertResilient — schema-drift airbag", () => {
  beforeEach(() => {
    upsert.mockReset();
  });

  it("drops PGRST204 unknown columns one by one and succeeds", async () => {
    upsert
      .mockResolvedValueOnce(
        err("Could not find the 'startingPrice' column of 'services' in the schema cache"),
      )
      .mockResolvedValueOnce(
        err("Could not find the 'currency' column of 'services' in the schema cache"),
      )
      .mockResolvedValueOnce({ error: null });

    const res = await upsertResilient("services", {
      id: "srv-x",
      title: "T",
      startingPrice: "$1",
      currency: "USD",
    });

    expect(res).toEqual({ ok: true, dropped: ["startingPrice", "currency"] });
    const lastPayload = upsert.mock.calls[2]![0] as Record<string, unknown>;
    expect(lastPayload).toMatchObject({ id: "srv-x", title: "T" });
    expect("startingPrice" in lastPayload).toBe(false);
    expect("currency" in lastPayload).toBe(false);
    expect(typeof lastPayload.updated_at).toBe("string");
  });

  it("still understands the raw Postgres 42703 message", async () => {
    upsert
      .mockResolvedValueOnce(err('column "startingPrice" of relation "services" does not exist'))
      .mockResolvedValueOnce({ error: null });

    const res = await upsertResilient("services", { id: "s1", title: "T", startingPrice: "$1" });

    expect(res).toEqual({ ok: true, dropped: ["startingPrice"] });
  });

  it("never drops id — reports the failure instead", async () => {
    upsert.mockResolvedValueOnce(err("Could not find the 'id' column of 'services' in the schema cache"));

    const res = await upsertResilient("services", { id: "s1", title: "T" });

    expect(res.ok).toBe(false);
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it("fails fast on unrelated database errors", async () => {
    upsert.mockResolvedValueOnce(err("permission denied for table services"));

    const res = await upsertResilient("services", { id: "s1", title: "T" });

    expect(res.ok).toBe(false);
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
