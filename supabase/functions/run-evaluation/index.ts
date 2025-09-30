// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import {createClient, SupabaseClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import type {Database} from "./database.ts";
import {toAppendix, toJudgeAssignments} from "./helper.ts";
import {Appendix, EvaluationInsert, JudgeAssignments} from "./types.ts";

type Verdict = "pass" | "fail" | "inconclusive";


const OPENAI_API_KEY: string | undefined = Deno.env.get("OPENAI_API_KEY");
const GROQ_API_KEY: string | undefined = Deno.env.get("GROQ_API_KEY");
const HUGGINGFACE_API_KEY: string | undefined = Deno.env.get("HUGGINGFACE_API_KEY");

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    // Must include all headers the browser says it will send in preflight (supabase-js uses these)
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function getQuestionText(appendix: Appendix[], questionId: string): string | null {
    for (const app of appendix) {
        for (const q of app.questions) {
            if (q.data.id === questionId) return q.data.questionText;
        }
    }
    return null;
}

function getAnswerForQuestion(appendix: Appendix[], questionId: string): {
    choice: string | string[];
    reasoning: string
} | null {
    for (const app of appendix) {
        const ans = app.answers[questionId];
        if (ans) return ans;
    }
    return null;
}

// Unused for now due to missing API key
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function callOpenAI(model: string, system: string, questionText: string, answerChoice: string | string[], answerReasoning: string): Promise<{
    verdict: Verdict;
    reasoning: string;
    raw: string
}> {
    if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
    const userContent = [
        "You are an impartial evaluator. Given a question and an answer, decide if the answer is correct (pass), incorrect (fail), or cannot be determined (inconclusive).",
        "Return ONLY a valid JSON object with keys: verdict ('pass'|'fail'|'inconclusive') and reasoning (short, <= 50 words).",
        "Question:", questionText,
        "Answer choice:", Array.isArray(answerChoice) ? answerChoice.join(", ") : String(answerChoice),
        "Answer reasoning:", answerReasoning,
    ].join("\n\n");

    const body = {
        model: model || "gpt-4o-mini",
        temperature: 0,
        response_format: {type: "json_object"},
        messages: [
            {role: "system", content: system || ""},
            {role: "user", content: userContent},
        ],
    } as const;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`OpenAI API error: ${resp.status} ${text}`);
    }

    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    // Try to parse JSON safely
    let verdict: Verdict = "inconclusive";
    let reasoning: string;
    try {
        const parsed = JSON.parse(content);
        const v = String(parsed.verdict || parsed.VERDICT || parsed.result || "").toLowerCase();
        if (v === "pass" || v === "fail" || v === "inconclusive") {
            verdict = v as Verdict;
        }
        const r = String(parsed.reasoning || parsed.REASONING || "");
        reasoning = r.slice(0, 400);
    } catch {
        // Fallback: simple heuristics
        const lower = content.toLowerCase();
        if (lower.includes("pass")) verdict = "pass";
        else if (lower.includes("fail")) verdict = "fail";
        else verdict = "inconclusive";
        reasoning = content.slice(0, 400);
    }

    return {verdict, reasoning, raw: content};
}

function parseVerdictFromText(content: string): { verdict: Verdict; reasoning: string } {
    let verdict: Verdict = "inconclusive";
    let reasoning: string;
    try {
        const parsed = JSON.parse(content) as Record<string, unknown>;
        const rawVerdict = (parsed.verdict ?? parsed.VERDICT ?? parsed.result) as unknown;
        const v = String(rawVerdict ?? "").toLowerCase();
        if (v === "pass" || v === "fail" || v === "inconclusive") {
            verdict = v as Verdict;
        }
        const rawReason = (parsed.reasoning ?? (parsed as Record<string, unknown>).REASONING) as unknown;
        const r = typeof rawReason === "string" ? rawReason : String(rawReason ?? "");
        reasoning = r.slice(0, 400);
    } catch {
        const lower = content.toLowerCase();
        if (lower.includes("pass")) verdict = "pass";
        else if (lower.includes("fail")) verdict = "fail";
        else verdict = "inconclusive";
        reasoning = content.slice(0, 400);
    }
    return {verdict, reasoning};
}

async function callGroq(system: string, questionText: string, answerChoice: string | string[], answerReasoning: string, model?: string): Promise<{
    verdict: Verdict;
    reasoning: string;
    raw: string
}> {
    if (!GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
    const userContent = [
        "You are an impartial evaluator. Given a question and an answer, decide if the answer is correct (pass), incorrect (fail), or cannot be determined (inconclusive).",
        "Return ONLY a valid JSON object with keys: verdict ('pass'|'fail'|'inconclusive') and reasoning (short, <= 50 words).",
        "Question:", questionText,
        "Answer choice:", Array.isArray(answerChoice) ? answerChoice.join(", ") : String(answerChoice),
        "Answer reasoning:", answerReasoning,
    ].join("\n\n");

    const body = {
        model: model || "llama-3.1-8b-instant",
        temperature: 0,
        response_format: {type: "json_object"},
        messages: [
            {role: "system", content: system || ""},
            {role: "user", content: userContent},
        ],
    } as const;

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Groq API error: ${resp.status} ${text}`);
    }
    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const parsed = parseVerdictFromText(content);
    return {...parsed, raw: content};
}

async function callHuggingFace(system: string, questionText: string, answerChoice: string | string[], answerReasoning: string, model?: string): Promise<{
    verdict: Verdict;
    reasoning: string;
    raw: string
}> {
    if (!HUGGINGFACE_API_KEY) throw new Error("Missing HUGGINGFACE_API_KEY");
    const prompt = [
        "System:\n" + (system || ""),
        "You are an impartial evaluator. Given a question and an answer, decide if the answer is correct (pass), incorrect (fail), or cannot be determined (inconclusive).",
        "Return ONLY a valid JSON object with keys: verdict ('pass'|'fail'|'inconclusive') and reasoning (short, <= 50 words).",
        "Question:", questionText,
        "Answer choice:", Array.isArray(answerChoice) ? answerChoice.join(", ") : String(answerChoice),
        "Answer reasoning:", answerReasoning,
    ].join("\n\n");

    const hfModel = model || Deno.env.get("HF_MODEL") || "mistralai/Mistral-7B-Instruct-v0.2";
    const resp = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(hfModel)}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: {max_new_tokens: 300, temperature: 0.1, return_full_text: false},
        }),
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`HuggingFace API error: ${resp.status} ${text}`);
    }
    const data = await resp.json();
    // HF can return array or object depending on model/task
    let content: string;
    if (Array.isArray(data) && data[0]?.generated_text) content = data[0].generated_text as string;
    else if (typeof data === "object" && data?.generated_text) content = String(data.generated_text);
    else content = JSON.stringify(data);
    const parsed = parseVerdictFromText(content);
    return {...parsed, raw: content};
}

async function callFreeLLM(system: string, questionText: string, answerChoice: string | string[], answerReasoning: string): Promise<{
    verdict: Verdict;
    reasoning: string;
    raw: string;
    provider: string
}> {
    // Prefer Groq (free-tier key) -> Hugging Face Inference (free-tier key) -> heuristic
    if (GROQ_API_KEY) {
        const r = await callGroq(system, questionText, answerChoice, answerReasoning);
        return {...r, provider: "groq"};
    }
    if (HUGGINGFACE_API_KEY) {
        const r = await callHuggingFace(system, questionText, answerChoice, answerReasoning);
        return {...r, provider: "huggingface"};
    }
    // Heuristic fallback if no keys provided
    const combined = [questionText, Array.isArray(answerChoice) ? answerChoice.join(", ") : String(answerChoice), answerReasoning].join("\n");
    const lower = combined.toLowerCase();
    const verdict: Verdict = lower.includes("correct") || lower.includes("right") ? "pass" : (lower.includes("incorrect") || lower.includes("wrong") ? "fail" : "inconclusive");
    const reasoning = "Heuristic fallback used due to missing free LLM API key(s).";
    return {verdict, reasoning, raw: combined, provider: "heuristic"};
}

// Determine provider from judge.model_name
type ProviderKind = "groq" | "huggingface" | "heuristic" | "auto";

function providerFromModelName(modelName: string): { kind: ProviderKind; model?: string } {
    const m = (modelName || "").trim();
    if (m.toLowerCase() === "heuristic") return { kind: "heuristic" };
    if (m.startsWith("groq/")) return { kind: "groq", model: m.slice(5) || "llama-3.1-8b-instant" };
    if (m.startsWith("hf/")) return { kind: "huggingface", model: m.slice(3) };
    // Treat auto-free and any unknown value as auto
    return { kind: "auto" };
}

async function evaluateByModelName(
    modelName: string,
    system: string,
    questionText: string,
    answerChoice: string | string[],
    answerReasoning: string,
): Promise<{ verdict: Verdict; reasoning: string; raw: string; provider: string }> {
    const { kind, model } = providerFromModelName(modelName);
    if (kind === "groq") {
        const r = await callGroq(system, questionText, answerChoice, answerReasoning, model);
        return { ...r, provider: "groq" };
    }
    if (kind === "huggingface") {
        const r = await callHuggingFace(system, questionText, answerChoice, answerReasoning, model);
        return { ...r, provider: "huggingface" };
    }
    if (kind === "heuristic") {
        const combined = [
            questionText,
            Array.isArray(answerChoice) ? answerChoice.join(", ") : String(answerChoice),
            answerReasoning,
        ].join("\n");
        const lower = combined.toLowerCase();
        const verdict: Verdict = lower.includes("correct") || lower.includes("right")
            ? "pass"
            : (lower.includes("incorrect") || lower.includes("wrong") ? "fail" : "inconclusive");
        const reasoning = "Heuristic evaluation as selected by judge.model_name.";
        return { verdict, reasoning, raw: combined, provider: "heuristic" };
    }
    // Auto
    return callFreeLLM(system, questionText, answerChoice, answerReasoning);
}

async function persistEvaluationBestEffort(supabase: SupabaseClient<Database>, ev: EvaluationInsert) {
    try {
        const { error } = await supabase
            .from("evaluations")
            .insert(ev);
        if (!error) return { storedIn: "db" as const };
        console.error("Failed to insert evaluation:", error.message);
    } catch (e) {
        console.error("Exception inserting evaluation:", e instanceof Error ? e.message : String(e));
    }

    return { storedIn: "none" as const };
}

console.log("run-evaluation function ready");

function getSupabaseClient(): SupabaseClient<Database> {
    const url = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("APP_SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("KEY");
    if (!url) {
        throw new Error(
            "Supabase URL is not set. Please set SUPABASE_URL (preferred) or APP_SUPABASE_URL as an Edge Function secret."
        );
    }
    if (!key) {
        throw new Error(
            "Supabase key is not set. Please set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY (or KEY) as an Edge Function secret."
        );
    }
    return createClient<Database>(url, key);
}

function decodeBase64Url(input: string): string {
    const pad = input.length % 4;
    const base64 = input.replace(/-/g, "+").replace(/_/g, "/") + (pad ? "=".repeat(4 - pad) : "");
    try {
        return atob(base64);
    } catch {
        return "";
    }
}

function getUserIdFromRequest(req: Request): string | null {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    try {
        const payloadJson = decodeBase64Url(parts[1]);
        const payload = JSON.parse(payloadJson) as Record<string, unknown>;
        const sub = payload.sub;
        if (typeof sub === "string" && sub.length > 0) return sub;
        const uid = (payload.user_id ?? (payload as Record<string, unknown>)["userId"]) as unknown;
        return typeof uid === "string" ? uid : null;
    } catch {
        return null;
    }
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: CORS_HEADERS,
        });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({error: "Method not allowed"}), {
            status: 405,
            headers: {...CORS_HEADERS, "Content-Type": "application/json"}
        });
    }

    try {
        const body = await req.json().catch(() => ({}));

        const appendixRaw = body.appendix ?? body.appendixData ?? [];
        const assignmentsRaw = body.assignments ?? body.assignmentsData ?? {};

        const appendix: Appendix[] = toAppendix(appendixRaw);
        const assignments: JudgeAssignments = toJudgeAssignments(assignmentsRaw);

        const supabase = getSupabaseClient();
        const userIdFromReq = getUserIdFromRequest(req);
        const evaluations: EvaluationInsert[] = [];
        const failures: { question_id: string; judge_id: string; error: string }[] = [];

        for (const [questionId, judges] of Object.entries(assignments)) {
            const qText = getQuestionText(appendix, questionId);
            const ans = getAnswerForQuestion(appendix, questionId);
            if (!qText || !ans) {
                failures.push({question_id: questionId, judge_id: "-", error: "Question text or answer not found"});
                continue;
            }

            for (const judge of judges) {
                try {
                    const ai = await evaluateByModelName(judge.model_name, judge.system_prompt, qText, ans.choice, ans.reasoning);
                    const ev: EvaluationInsert = {
                        question_id: questionId,
                        judge_id: judge.id,
                        verdict: ai.verdict,
                        reasoning: ai.reasoning,
                        model_name: judge.model_name,
                        user_id: userIdFromReq ?? judge.user_id,
                    };
                    evaluations.push(ev);
                    await persistEvaluationBestEffort(supabase, ev);
                } catch (e) {
                    failures.push({
                        question_id: questionId,
                        judge_id: judge.id,
                        error: e instanceof Error ? e.message : String(e)
                    });
                }
            }
        }

        return new Response(
            JSON.stringify({ok: true, count: evaluations.length, evaluations, failures}),
            {headers: {...CORS_HEADERS, "Content-Type": "application/json"}}
        );
    } catch (e) {
        return new Response(
            JSON.stringify({ok: false, error: e instanceof Error ? e.message : String(e)}),
            {status: 500, headers: {...CORS_HEADERS, "Content-Type": "application/json"}}
        );
    }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/run-evaluation' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
