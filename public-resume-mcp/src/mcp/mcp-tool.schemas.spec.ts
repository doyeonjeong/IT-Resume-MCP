import {
  GenerateResumeArgsSchema,
  JdAnalysisSchema,
  ResumeBulletsSchema,
  parseToolArgs,
  validateToolOutput,
} from './mcp-tool.schemas';

describe('MCP tool schemas', () => {
  it('parses valid generate_resume arguments', () => {
    const result = parseToolArgs('generate_resume', GenerateResumeArgsSchema, {
      position: 'Backend Developer',
      jdText: 'NestJS와 TypeScript 경험자 우대',
    });

    expect(result.position).toBe('Backend Developer');
    expect(result.language).toBe('ko');
  });

  it('rejects invalid generate_resume arguments', () => {
    expect(() =>
      parseToolArgs('generate_resume', GenerateResumeArgsSchema, {
        position: '',
        jdText: '',
      }),
    ).toThrow('INVALID_GENERATE_RESUME_ARGS');
  });

  it('validates analyze_jd output shape', () => {
    const output = validateToolOutput('analyze_jd', JdAnalysisSchema, {
      roleTitle: 'Backend Developer',
      companyType: 'Startup',
      requiredSkills: ['NestJS'],
      preferredSkills: ['AWS'],
      responsibilities: ['Build APIs'],
      keywords: ['TypeScript'],
      seniority: 'mid',
      atsKeywords: ['NestJS', 'TypeScript'],
      riskFactors: ['No finance domain experience'],
    });

    expect(output.seniority).toBe('mid');
  });

  it('rejects malformed resume bullets output', () => {
    expect(() =>
      validateToolOutput('generate_resume_bullets', ResumeBulletsSchema, {
        summary: 'summary only',
      }),
    ).toThrow('INVALID_GENERATE_RESUME_BULLETS_OUTPUT');
  });
});
