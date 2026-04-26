import { z } from 'zod';
import { ProfileProjectSchema } from '../profile/profile.schema';

const NonEmptyString = z.string().trim().min(1);
const LanguageSchema = z.enum(['ko', 'en']).default('ko');
const ToneSchema = z
  .enum(['concise', 'professional', 'startup'])
  .default('professional');
const TemplateSchema = z
  .enum(['ios', 'backend', 'fullstack', 'ai-agent', 'general'])
  .default('general');

export const JdAnalysisSchema = z.object({
  roleTitle: NonEmptyString,
  companyType: NonEmptyString,
  requiredSkills: z.array(NonEmptyString),
  preferredSkills: z.array(NonEmptyString),
  responsibilities: z.array(NonEmptyString),
  keywords: z.array(NonEmptyString),
  seniority: z.enum(['junior', 'mid', 'senior', 'unknown']),
  atsKeywords: z.array(NonEmptyString),
  riskFactors: z.array(NonEmptyString),
});

export const ProfileMatchSchema = z.object({
  strongMatches: z.array(NonEmptyString),
  partialMatches: z.array(NonEmptyString),
  missingButRecoverable: z.array(NonEmptyString),
  doNotOverclaim: z.array(NonEmptyString),
  recommendedPositioning: NonEmptyString,
});

export const ResumeBulletsSchema = z.object({
  summary: NonEmptyString,
  skills: z.array(NonEmptyString),
  experienceBullets: z.array(NonEmptyString),
  projectBullets: z.array(NonEmptyString),
  coverLetterHooks: z.array(NonEmptyString),
  needsUserInput: z.array(NonEmptyString).optional(),
});

export const UpdateProfileArgsSchema = z
  .object({
    name: NonEmptyString.optional(),
    title: NonEmptyString.optional(),
    summary: NonEmptyString.optional(),
    skills: z.array(NonEmptyString).optional(),
    projects: z.array(ProfileProjectSchema).optional(),
  })
  .strict();

export const GenerateResumeArgsSchema = z
  .object({
    position: NonEmptyString,
    jdText: NonEmptyString,
    companyName: NonEmptyString.optional(),
    language: LanguageSchema.optional(),
  })
  .strict();

export const GeneratePortfolioArgsSchema = z
  .object({
    language: LanguageSchema.optional(),
  })
  .strict();

export const GenerateCoverLetterArgsSchema = z
  .object({
    position: NonEmptyString,
    jdText: NonEmptyString,
    companyName: NonEmptyString,
    language: LanguageSchema.optional(),
  })
  .strict();

export const AnalyzeJdArgsSchema = z
  .object({
    jdText: NonEmptyString,
    language: LanguageSchema.optional(),
  })
  .strict();

export const MatchProfileToJdArgsSchema = z
  .object({
    jdAnalysis: JdAnalysisSchema,
    language: LanguageSchema.optional(),
  })
  .strict();

export const GenerateResumeBulletsArgsSchema = z
  .object({
    jdAnalysis: JdAnalysisSchema,
    language: LanguageSchema.optional(),
    tone: ToneSchema.optional(),
  })
  .strict();

export const GenerateResumeMarkdownArgsSchema = z
  .object({
    resumeData: ResumeBulletsSchema,
    template: TemplateSchema.optional(),
  })
  .strict();

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}

export function parseToolArgs<T>(
  toolName: string,
  schema: z.ZodSchema<T>,
  input: unknown,
): T {
  const parsed = schema.safeParse(input ?? {});
  if (!parsed.success) {
    throw new Error(
      `INVALID_${toolName.toUpperCase()}_ARGS: ${formatZodError(parsed.error)}`,
    );
  }
  return parsed.data;
}

export function validateToolOutput<T>(
  toolName: string,
  schema: z.ZodSchema<T>,
  input: unknown,
): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      `INVALID_${toolName.toUpperCase()}_OUTPUT: ${formatZodError(parsed.error)}`,
    );
  }
  return parsed.data;
}
