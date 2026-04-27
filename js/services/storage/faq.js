import { apiDelete, apiGet, apiPost } from "../api.js";

export async function getFaq() {
  return apiGet("/faq");
}

export async function addFaqItem({ question, answer }) {
  const trimmedQuestion = String(question ?? "").trim();
  const answerLines = Array.isArray(answer)
    ? answer
        .map((v) => String(v))
        .map((v) => v.trim())
        .filter(Boolean)
    : String(answer ?? "")
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);

  if (!trimmedQuestion) return { ok: false, message: "Введите вопрос" };
  if (answerLines.length === 0) return { ok: false, message: "Введите ответ" };

  const item = await apiPost("/faq", {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    question: trimmedQuestion,
    answer: answerLines,
  });

  return { ok: true, item };
}

export async function removeFaqItem(id) {
  const faqId = String(id ?? "").trim();
  if (!faqId) return { ok: false };
  await apiDelete(`/faq/${encodeURIComponent(faqId)}`);
  return { ok: true };
}
