import { describe, it, expect } from "vitest";
import { computeRating, rankEmoji } from "@/lib/rating";
import { schoolStatus, DAY_MS, type SchoolStat } from "@/lib/school-stats";

function stat(over: Partial<SchoolStat> = {}): SchoolStat {
  return {
    id: "s1",
    name: "Test maktab",
    region: null,
    district: null,
    expected_students: 100,
    student_count: 50,
    tested_students: 25,
    results_30d: 0,
    last_activity: new Date().toISOString(),
    counselor_id: "c1",
    counselor_name: "Maslahatchi X",
    ...over,
  };
}

describe("schoolStatus", () => {
  it("maslahatchi yo'q -> ⚪ rank 0", () => {
    const r = schoolStatus(stat({ counselor_id: null }));
    expect(r).toMatchObject({ emoji: "⚪", rank: 0 });
  });

  it("faollik yo'q -> 🔴 rank 1", () => {
    const r = schoolStatus(stat({ last_activity: null }));
    expect(r).toMatchObject({ emoji: "🔴", rank: 1 });
  });

  it("7 kun ichida -> 🟢 rank 3", () => {
    const r = schoolStatus(
      stat({ last_activity: new Date(Date.now() - 2 * DAY_MS).toISOString() }),
    );
    expect(r).toMatchObject({ emoji: "🟢", rank: 3 });
  });

  it("7-30 kun -> 🟡 rank 2", () => {
    const r = schoolStatus(
      stat({ last_activity: new Date(Date.now() - 15 * DAY_MS).toISOString() }),
    );
    expect(r).toMatchObject({ emoji: "🟡", rank: 2 });
  });

  it("30 kundan eski -> 🔴 rank 1", () => {
    const r = schoolStatus(
      stat({ last_activity: new Date(Date.now() - 40 * DAY_MS).toISOString() }),
    );
    expect(r).toMatchObject({ emoji: "🔴", rank: 1 });
  });
});

describe("computeRating", () => {
  it("maslahatchi biriktirilmagan bo'lsa null", () => {
    expect(computeRating(stat({ counselor_id: null }))).toBeNull();
  });

  it("to'liq hisob: qamrov 50% + test 50% + faol + vazifasiz = 70", () => {
    // student 50/100 -> 50% * 0.3 = 15; tested 25/50 -> 50% * 0.3 = 15;
    // last_activity hozir -> rank 3 -> 20; vazifa yo'q -> 100% * 0.2 = 20
    const r = computeRating(stat());
    expect(r).not.toBeNull();
    expect(r!.parts).toEqual({ coverage: 15, tested: 15, activity: 20, tasks: 20 });
    expect(r!.score).toBe(70);
  });

  it("expected_students yo'q bo'lsa qamrov 0", () => {
    const r = computeRating(stat({ expected_students: null }));
    expect(r!.parts.coverage).toBe(0);
  });

  it("vazifalar berilgan bo'lsa qabul ulushidan hisoblanadi", () => {
    // accepted 3 / assigned 6 -> 50% * 0.2 = 10
    const r = computeRating(stat(), { assigned: 6, accepted: 3 });
    expect(r!.parts.tasks).toBe(10);
  });

  it("harakatsiz maktab (faollik yo'q) -> activity 0", () => {
    const r = computeRating(stat({ last_activity: null }));
    expect(r!.parts.activity).toBe(0);
  });
});

describe("rankEmoji", () => {
  it("top-3 medallar, keyin raqam", () => {
    expect(rankEmoji(0)).toBe("🥇");
    expect(rankEmoji(1)).toBe("🥈");
    expect(rankEmoji(2)).toBe("🥉");
    expect(rankEmoji(3)).toBe("4.");
  });
});
