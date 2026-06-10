// ===================================================================
// EduLens — Ball hisoblash mantiqi (sof funksiyalar)
// Har bir test turi uchun: javoblarni qabul qiladi -> natija qaytaradi
// ===================================================================

export interface QuestionLite {
  id: string;
  subscale: string | null;
  question_type: string;
  options: { value: number; label: string }[];
}

// Bitta test natijasi (test_results jadviga yoziladi)
export interface ScoredResult {
  rawScores: Record<string, number>;
  scaledScores: Record<string, number>;
  personalityType: string | null;
  hollandCode: string | null;
}

// answers: questionId -> tanlangan qiymat (number)
// keys:    questionId -> to'g'ri qiymat (faqat IQ testlar uchun)
export type AnswerMap = Record<string, number>;
export type KeyMap = Record<string, number>;

const HOLLAND_LETTERS = ["R", "I", "A", "S", "E", "C"] as const;

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

// --- Holland (RIASEC) ----------------------------------------------
function scoreHolland(qs: QuestionLite[], answers: AnswerMap): ScoredResult {
  const raw: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const count: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  for (const q of qs) {
    const sub = (q.subscale ?? "").toUpperCase();
    if (!(sub in raw)) continue;
    count[sub] += 1;
    raw[sub] += answers[q.id] ?? 0;
  }

  const scaled: Record<string, number> = {};
  for (const l of HOLLAND_LETTERS) {
    scaled[l] = count[l] > 0 ? round((raw[l] / count[l]) * 100) : 0;
  }

  // Eng yuqori 3 ta harf -> Holland kodi (masalan "RIA")
  const code = [...HOLLAND_LETTERS]
    .sort((a, b) => raw[b] - raw[a] || scaled[b] - scaled[a])
    .slice(0, 3)
    .join("");

  return { rawScores: raw, scaledScores: scaled, personalityType: null, hollandCode: code };
}

// --- Ayzenk (EPI) --------------------------------------------------
function scoreEysenck(qs: QuestionLite[], answers: AnswerMap): ScoredResult {
  const raw: Record<string, number> = { E: 0, N: 0, L: 0 };
  const count: Record<string, number> = { E: 0, N: 0, L: 0 };

  for (const q of qs) {
    const sub = (q.subscale ?? "").toUpperCase();
    if (!(sub in raw)) continue;
    count[sub] += 1;
    raw[sub] += answers[q.id] ?? 0;
  }

  const extraversion = count.E > 0 ? round((raw.E / count.E) * 100) : 0;
  const neuroticism = count.N > 0 ? round((raw.N / count.N) * 100) : 0;
  const stability = round(100 - neuroticism);

  // Temperament (Ayzenk doirasi)
  const highE = extraversion >= 50;
  const highN = neuroticism >= 50;
  let temperament = "Aralash";
  if (highE && highN) temperament = "Xolerik";
  else if (highE && !highN) temperament = "Sangvinik";
  else if (!highE && highN) temperament = "Melanxolik";
  else temperament = "Flegmatik";

  // L > 50% bo'lsa natija ishonchsiz deb belgilanadi
  const lieReliable = count.L === 0 || raw.L / count.L <= 0.55;

  return {
    rawScores: raw,
    scaledScores: {
      extraversion,
      neuroticism,
      stability,
      reliable: lieReliable ? 1 : 0,
    },
    personalityType: temperament,
    hollandCode: null,
  };
}

// --- Big Five ------------------------------------------------------
function scoreBigFive(qs: QuestionLite[], answers: AnswerMap): ScoredResult {
  const dims = ["O", "C", "E", "A", "N"];
  const raw: Record<string, number> = {};
  const maxv: Record<string, number> = {};
  dims.forEach((d) => { raw[d] = 0; maxv[d] = 0; });

  for (const q of qs) {
    const sub = (q.subscale ?? "").toUpperCase();
    if (!dims.includes(sub)) continue;
    const maxOpt = Math.max(...q.options.map((o) => o.value), 1);
    raw[sub] += answers[q.id] ?? 0;
    maxv[sub] += maxOpt;
  }

  const scaled: Record<string, number> = {};
  dims.forEach((d) => {
    scaled[d] = maxv[d] > 0 ? round((raw[d] / maxv[d]) * 100) : 0;
  });

  return { rawScores: raw, scaledScores: scaled, personalityType: null, hollandCode: null };
}

// --- IQ testlar (Raven, Matematik) — to'g'ri javob asosida ---------
function scoreIQ(qs: QuestionLite[], answers: AnswerMap, keys: KeyMap): ScoredResult {
  let correct = 0;
  let total = 0;
  for (const q of qs) {
    if (!(q.id in keys)) continue;
    total += 1;
    if ((answers[q.id] ?? -999) === keys[q.id]) correct += 1;
  }
  const percent = total > 0 ? round((correct / total) * 100) : 0;
  // IQ taxminiy shkalasi: 0% -> 70, 100% -> 130 (9-sinf demo normasi)
  const iq = Math.round(70 + percent * 0.6);
  return {
    rawScores: { correct, total },
    scaledScores: { percent, iq },
    personalityType: null,
    hollandCode: null,
  };
}

// --- Fan testlari (Tarix, Ingliz tili, Matematika) — to'g'ri javob -> foiz + baho ---
function scoreSubject(qs: QuestionLite[], answers: AnswerMap, keys: KeyMap): ScoredResult {
  let correct = 0;
  let total = 0;
  for (const q of qs) {
    if (!(q.id in keys)) continue;
    total += 1;
    if ((answers[q.id] ?? -999) === keys[q.id]) correct += 1;
  }
  const percent = total > 0 ? round((correct / total) * 100) : 0;
  // O'zbekiston 5 balli baho tizimi
  // 86-100% -> 5 (a'lo), 71-85% -> 4 (yaxshi), 56-70% -> 3 (qoniqarli), <56% -> 2
  let grade = 2;
  if (percent >= 86) grade = 5;
  else if (percent >= 71) grade = 4;
  else if (percent >= 56) grade = 3;
  return {
    rawScores: { correct, total },
    scaledScores: { percent, grade, correct, total },
    personalityType: null,
    hollandCode: null,
  };
}

// --- Umumiy (EQ, Liderlik, Schulte, va boshqalar) ------------------
function scoreGeneric(qs: QuestionLite[], answers: AnswerMap): ScoredResult {
  let sum = 0;
  let max = 0;
  for (const q of qs) {
    const maxOpt = Math.max(...q.options.map((o) => o.value), 1);
    sum += answers[q.id] ?? 0;
    max += maxOpt;
  }
  const percent = max > 0 ? round((sum / max) * 100) : 0;
  return {
    rawScores: { sum, max },
    scaledScores: { percent, score: percent },
    personalityType: null,
    hollandCode: null,
  };
}

// --- Dispatcher ----------------------------------------------------
export function scoreTest(
  testType: string,
  qs: QuestionLite[],
  answers: AnswerMap,
  keys: KeyMap,
): ScoredResult {
  switch (testType) {
    case "holland":
      return scoreHolland(qs, answers);
    case "eysenck":
      return scoreEysenck(qs, answers);
    case "big5":
      return scoreBigFive(qs, answers);
    case "raven":
    case "math_iq":
      return scoreIQ(qs, answers, keys);
    case "subject":
      return scoreSubject(qs, answers, keys);
    default:
      return scoreGeneric(qs, answers);
  }
}
