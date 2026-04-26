/**
 * Parse JSON from LLM output that may be wrapped in markdown code blocks
 * or contain extra text around the JSON.
 */
export function parseJsonFromLLM<T = unknown>(text: string): T {
  // 1. Try direct parse
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // continue to fallback strategies
  }

  // 2. Strip markdown code block (```json ... ``` or ``` ... ```)
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    } catch {
      // continue
    }
  }

  // 3. Extract first { ... } or [ ... ] block via brace/bracket matching
  const jsonStart = trimmed.search(/[{[]/);
  if (jsonStart !== -1) {
    const opener = trimmed[jsonStart];
    const closer = opener === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = jsonStart; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === opener) depth++;
      if (ch === closer) depth--;
      if (depth === 0) {
        const candidate = trimmed.slice(jsonStart, i + 1);
        try {
          return JSON.parse(candidate) as T;
        } catch {
          break;
        }
      }
    }
  }

  throw new Error(
    `LLM_JSON_PARSE_ERROR: LLM 응답에서 유효한 JSON을 추출할 수 없습니다. 응답 앞부분: "${trimmed.slice(0, 200)}..."`,
  );
}
