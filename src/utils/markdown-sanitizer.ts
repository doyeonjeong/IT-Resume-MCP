const REASONING_TAG_BLOCKS =
  /<(?:thought|thinking|reasoning|scratchpad|reflection)>[\s\S]*?<\/(?:thought|thinking|reasoning|scratchpad|reflection)>/gi;
const UNCLOSED_REASONING_TAGS =
  /<(?:thought|thinking|reasoning|scratchpad|reflection)>[\s\S]*$/gi;
const FENCED_BLOCK = /^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/;

export function sanitizeMarkdownOutput(raw: string): string {
  if (!raw) return raw;

  let text = raw.replace(REASONING_TAG_BLOCKS, '');
  text = text.replace(UNCLOSED_REASONING_TAGS, '');
  text = text.trim();

  const fenced = text.match(FENCED_BLOCK);
  if (fenced) text = fenced[1].trim();

  const headerIndex = findFirstMarkdownHeader(text);
  if (headerIndex > 0) {
    text = text.slice(headerIndex).trimStart();
  }

  text = text.replace(/[ \t]+$/gm, '');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

function findFirstMarkdownHeader(text: string): number {
  const lines = text.split('\n');
  let charOffset = 0;
  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line.trim())) return charOffset;
    charOffset += line.length + 1;
  }
  return -1;
}
