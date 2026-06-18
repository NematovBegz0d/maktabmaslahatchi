import { describe, it, expect } from "vitest";
import {
  buildCounselorNotifications,
  countUnseen,
  seenSnapshot,
  type CounselorNotifInput,
} from "@/lib/notifications";

// Hammasi joyida bo'lgan baza holat — har testda kerakli maydon o'zgartiriladi
const OK: CounselorNotifInput = {
  studentCount: 10,
  untestedCount: 0,
  clubCount: 3,
  emptyClubNames: [],
  studentsWithoutClub: 0,
  pendingTasks: 0,
  unreadAnnouncements: 0,
  councilMembers: 5,
  missingRequiredClubs: [],
  studentsWithoutPortfolio: 0,
  careerUnoriented79: 0,
};

const ids = (input: CounselorNotifInput) => buildCounselorNotifications(input).map((n) => n.id);

describe("buildCounselorNotifications", () => {
  it("hamma narsa joyida bo'lsa — bo'sh ro'yxat", () => {
    expect(buildCounselorNotifications(OK)).toEqual([]);
  });

  it("o'quvchi yo'q bo'lsa — 'students-empty' (action) ko'rsatadi", () => {
    const list = buildCounselorNotifications({ ...OK, studentCount: 0 });
    expect(list.map((n) => n.id)).toContain("students-empty");
    expect(list[0].severity).toBe("action");
    expect(list[0].to).toBe("/students-manage");
  });

  it("o'quvchi yo'q bo'lsa — test/to'garak-yozish signallari KO'RSATILMAYDI (zid emas)", () => {
    const list = ids({
      ...OK,
      studentCount: 0,
      untestedCount: 5, // e'tiborga olinmaydi — o'quvchi yo'q
      studentsWithoutClub: 5,
    });
    expect(list).not.toContain("students-untested");
    expect(list).not.toContain("students-no-club");
  });

  it("test topshirmaganlar bo'lsa — son sarlavhada", () => {
    const list = buildCounselorNotifications({ ...OK, untestedCount: 7 });
    const n = list.find((x) => x.id === "students-untested");
    expect(n).toBeDefined();
    expect(n!.title).toContain("7");
    expect(n!.signature).toBe("untested:7");
  });

  it("to'garak yo'q bo'lsa — 'clubs-empty', lekin bo'sh-to'garak signali emas", () => {
    const list = ids({ ...OK, clubCount: 0, emptyClubNames: ["A", "B"] });
    expect(list).toContain("clubs-empty");
    expect(list).not.toContain("clubs-no-members");
  });

  it("a'zosiz to'garaklar nomlari oldindan ko'rsatiladi (max 2 + qoldiq)", () => {
    const list = buildCounselorNotifications({
      ...OK,
      emptyClubNames: ["Shaxmat", "Debat", "Robototexnika"],
    });
    const n = list.find((x) => x.id === "clubs-no-members");
    expect(n!.title).toContain("3");
    expect(n!.body).toContain("Shaxmat, Debat");
    expect(n!.body).toContain("+1");
  });

  it("to'garakka yozilmagan o'quvchilar — 'students-no-club' (info)", () => {
    const list = buildCounselorNotifications({ ...OK, studentsWithoutClub: 4 });
    const n = list.find((x) => x.id === "students-no-club");
    expect(n!.severity).toBe("info");
    expect(n!.title).toContain("4");
  });

  it("bajarilmagan vazifa va o'qilmagan e'lon alohida signallar", () => {
    const list = ids({ ...OK, pendingTasks: 2, unreadAnnouncements: 3 });
    expect(list).toContain("tasks-pending");
    expect(list).toContain("announcements-unread");
  });

  it("kengash tuzilmagan bo'lsa — 'council-empty' (action) → /council", () => {
    const list = buildCounselorNotifications({ ...OK, councilMembers: 0 });
    const n = list.find((x) => x.id === "council-empty");
    expect(n).toBeDefined();
    expect(n!.severity).toBe("action");
    expect(n!.to).toBe("/council");
  });

  it("majburiy to'garaklar yetishmasa — nomlar oldindan ko'rsatiladi", () => {
    const list = buildCounselorNotifications({
      ...OK,
      missingRequiredClubs: ["Turon Teatr", "Debat", "Eco-Schools"],
    });
    const n = list.find((x) => x.id === "clubs-missing-required");
    expect(n!.title).toContain("3");
    expect(n!.body).toContain("Turon Teatr, Debat");
    expect(n!.to).toBe("/clubs");
  });

  it("to'garak umuman yo'q bo'lsa — majburiy-to'garak signali emas (clubs-empty bilan zid emas)", () => {
    const list = ids({ ...OK, clubCount: 0, missingRequiredClubs: ["Turon Teatr"] });
    expect(list).toContain("clubs-empty");
    expect(list).not.toContain("clubs-missing-required");
  });

  it("ijtimoiy portfolio bo'sh o'quvchilar — 'portfolio-empty' (info) → /students", () => {
    const list = buildCounselorNotifications({ ...OK, studentsWithoutPortfolio: 6 });
    const n = list.find((x) => x.id === "portfolio-empty");
    expect(n!.severity).toBe("info");
    expect(n!.title).toContain("6");
    expect(n!.to).toBe("/students");
  });

  it("kasbga yo'naltirilmagan 7-9 sinf — 'career-79' (warning)", () => {
    const list = buildCounselorNotifications({ ...OK, careerUnoriented79: 4 });
    const n = list.find((x) => x.id === "career-79");
    expect(n!.severity).toBe("warning");
    expect(n!.title).toContain("4");
  });

  it("o'quvchi yo'q bo'lsa — portfolio/kasb signallari KO'RSATILMAYDI", () => {
    const list = ids({
      ...OK,
      studentCount: 0,
      studentsWithoutPortfolio: 5,
      careerUnoriented79: 5,
    });
    expect(list).not.toContain("portfolio-empty");
    expect(list).not.toContain("career-79");
  });

  it("muhimlik tartibi: action → warning → info", () => {
    const list = buildCounselorNotifications({
      ...OK,
      pendingTasks: 1, // action
      untestedCount: 1, // warning
      studentsWithoutClub: 1, // info
    });
    const sev = list.map((n) => n.severity);
    expect(sev).toEqual(["action", "warning", "info"]);
  });

  it("signature qiymat o'zgarsa o'zgaradi (badge qayta paydo bo'lishi uchun)", () => {
    const a = buildCounselorNotifications({ ...OK, pendingTasks: 1 })[0].signature;
    const b = buildCounselorNotifications({ ...OK, pendingTasks: 2 })[0].signature;
    expect(a).not.toBe(b);
  });
});

describe("countUnseen / seenSnapshot (o'qilmaganlik mantig'i)", () => {
  const list = buildCounselorNotifications({
    ...OK,
    pendingTasks: 2,
    untestedCount: 3,
  });

  it("seen bo'sh bo'lsa — hammasi o'qilmagan", () => {
    expect(countUnseen(list, {})).toBe(list.length);
    expect(list.length).toBeGreaterThan(0);
  });

  it("seenSnapshot olingach — o'qilmagan 0 ga tushadi", () => {
    expect(countUnseen(list, seenSnapshot(list))).toBe(0);
  });

  it("bitta signal qiymati o'zgarsa — faqat o'sha yana o'qilmagan bo'ladi", () => {
    const seen = seenSnapshot(list);
    const changed = buildCounselorNotifications({ ...OK, pendingTasks: 5, untestedCount: 3 });
    expect(countUnseen(changed, seen)).toBe(1); // faqat 'tasks-pending' imzosi o'zgardi
  });

  it("eski seen'da bo'lmagan yangi signal — o'qilmagan hisoblanadi", () => {
    const seen = seenSnapshot(buildCounselorNotifications({ ...OK, pendingTasks: 2 }));
    expect(countUnseen(list, seen)).toBe(1); // 'students-untested' yangi qo'shildi
  });

  it("seenSnapshot id → signature xaritasini qaytaradi", () => {
    const snap = seenSnapshot(list);
    list.forEach((n) => expect(snap[n.id]).toBe(n.signature));
  });
});
