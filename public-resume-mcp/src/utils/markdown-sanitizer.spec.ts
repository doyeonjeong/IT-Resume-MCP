import { sanitizeMarkdownOutput } from './markdown-sanitizer';

describe('sanitizeMarkdownOutput', () => {
  it('strips closed <thought> blocks', () => {
    const input = `<thought>Reasoning about how to format...</thought>\n# 정도연\n## Summary\nFull-stack developer.`;
    const out = sanitizeMarkdownOutput(input);
    expect(out.startsWith('# 정도연')).toBe(true);
    expect(out).not.toContain('<thought>');
    expect(out).not.toContain('Reasoning about');
  });

  it('strips unclosed <thinking> tail', () => {
    const input = `# Resume\nContent\n<thinking>oops never closed`;
    const out = sanitizeMarkdownOutput(input);
    expect(out).not.toContain('<thinking>');
    expect(out).toContain('# Resume');
  });

  it('drops leading prose before the first markdown header', () => {
    const input = `Sure, here is the formatted resume:\n\n# 정도연\n## Summary\nDev.`;
    const out = sanitizeMarkdownOutput(input);
    expect(out.startsWith('# 정도연')).toBe(true);
    expect(out).not.toContain('Sure, here is');
  });

  it('unwraps a markdown code fence around the whole output', () => {
    const input = '```markdown\n# 정도연\n## Summary\nDev.\n```';
    const out = sanitizeMarkdownOutput(input);
    expect(out.startsWith('# 정도연')).toBe(true);
    expect(out).not.toContain('```');
  });

  it('handles Gemma 4 verbose reasoning prefix (real-world sample)', () => {
    const input = `<thought>*   Input: Structured JSON resume data for "정도연 — Full-stack Developer".\n    *   Template: "general".\n    *   Goal: Clean, ATS-friendly Markdown resume.\n\n    *   *Header*:\n        # 정도연\n        Full-stack Developer\n</thought>\n\n# 정도연\nFull-stack Developer (Backend / AI Agent)\n\n## Summary\nLLM 기반 AI Agent 개발자.`;
    const out = sanitizeMarkdownOutput(input);
    expect(out.startsWith('# 정도연')).toBe(true);
    expect(out).not.toContain('<thought>');
    expect(out).not.toContain('Goal: Clean');
    expect(out).toContain('## Summary');
  });

  it('preserves clean markdown unchanged', () => {
    const clean = `# 정도연\n\n## Summary\nDev.\n\n## Skills\n- TypeScript\n- NestJS`;
    expect(sanitizeMarkdownOutput(clean)).toBe(clean);
  });

  it('collapses excess blank lines', () => {
    const input = `# A\n\n\n\n## B\n\n\nText`;
    expect(sanitizeMarkdownOutput(input)).toBe('# A\n\n## B\n\nText');
  });

  it('returns empty input as-is', () => {
    expect(sanitizeMarkdownOutput('')).toBe('');
  });
});
