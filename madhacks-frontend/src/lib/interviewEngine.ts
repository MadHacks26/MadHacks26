// ─── interviewEngine.ts ───────────────────────────────────────────────────
// Handles: Gemini question gen → ElevenLabs TTS → Browser STT transcription
import { loadRoadmapMeta } from "./roadmapStore";


const GEMINI_KEY          = import.meta.env.VITE_GEMINI_KEY          as string;
const ELEVENLABS_KEY      = import.meta.env.VITE_ELEVENLABS_KEY      as string;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID as string ; // "Sarah" default

// ─── Types ────────────────────────────────────────────────────────────────

export interface QuestionItem {
  question: string;
  topic:    string;
}

export interface QAPair {
  question: string;
  answer:   string;
  topic:    string;
}

export interface FeedbackResult {
  overallScore:  number; // 0-100
  overallRemark: string;
  breakdown: {
    question:        string;
    answer:          string;
    topic:           string;
    score:           number;
    remark:          string;
    suggestedAnswer: string;
  }[];
}

// ─── Gemini: Generate ALL questions in ONE call ───────────────────────────
const meta = loadRoadmapMeta();
const COMPANY = meta?.company ?? "a well-known tech company";
const ROLE = meta?.role ?? "Software Engineer";

export async function generateAllQuestions(
  totalQuestions: number = 5
): Promise<QuestionItem[]> {
  const prompt = `You are a senior interviewer at ${COMPANY} for the role of ${ROLE}.

Based on your experience, generate the **top ${totalQuestions} technical interview questions** a candidate applying to ${ROLE} at ${COMPANY} is most likely to face.

Rules:
- Each question must cover a **different key concept or skill** relevant to the role.
- Questions should be **medium difficulty**, except the last question, which should be **slightly harder**.
- Each question should be **answerable verbally in 2-3 minutes**.
- Provide only a **valid JSON array** in the following format:

[
  {"question": "...", "topic": "..."},
  {"question": "...", "topic": "..."},
  {"question": "...", "topic": "..."},
  {"question": "...", "topic": "..."},
  {"question": "...", "topic": "..."}
]`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1000 },
      }),
    }
  );

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Gemini error ${res.status}: ${msg}`);
  }

  const data  = await res.json();
  const raw   = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const clean = raw.replace(/```json|```/g, "").trim();

  const parsed = JSON.parse(clean);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Gemini returned unexpected shape — expected an array");
  }

  return parsed as QuestionItem[];
}

// ─── Gemini: Generate feedback ─────────────────────────────────────────────

export async function generateFeedback(pairs: QAPair[]): Promise<FeedbackResult> {
  const pairsText = pairs
    .map((p, i) => `Q${i + 1} [${p.topic}]: ${p.question}\nAnswer: ${p.answer || "(no answer given)"}`)
    .join("\n\n");

  const prompt = `You are a recruiter reviewing a technical interview.

Here are the interview questions and the candidate's answers:
${pairsText}

Evaluate each answer rigorously. Give an overall score and per-question scores.

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "overallScore": <0-100>,
  "overallRemark": "<2-3 sentence summary of candidate performance>",
  "breakdown": [
    {
      "question": "<question text>",
      "answer": "<candidate answer>",
      "topic": "<topic>",
      "score": <0-100>,
      "remark": "<specific feedback on this answer>",
      "suggestedAnswer": "<concise ideal answer>"
    }
  ]
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
      }),
    }
  );

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Gemini feedback error ${res.status}: ${msg}`);
  }

  const data  = await res.json();
  const raw   = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as FeedbackResult;
}

// ─── ElevenLabs: TTS → play audio ─────────────────────────────────────────

export async function speakText(text: string): Promise<void> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    audio.play().catch(reject);
  });
}

// ─── Browser STT ──────────────────────────────────────────────────────────

export function createSTT(
  onTranscript: (text: string, isFinal: boolean) => void,
  onEnd: () => void
): { start: () => void; stop: () => void } {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("SpeechRecognition not supported — use Chrome or Edge");
    return { start: () => {}, stop: () => {} };
  }

  const rec           = new SpeechRecognition();
  rec.continuous      = true;
  rec.interimResults  = true;
  rec.lang            = "en-US";

  rec.onresult = (e: any) => {
    let interim = "";
    let final   = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    if (final)        onTranscript(final, true);
    else if (interim) onTranscript(interim, false);
  };

  rec.onend = onEnd;

  return {
    start: () => { try { rec.start(); } catch {} },
    stop:  () => { try { rec.stop();  } catch {} },
  };
}