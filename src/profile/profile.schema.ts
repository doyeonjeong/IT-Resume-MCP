import { z } from 'zod';

const NonEmptyString = z.string().trim().min(1);

export const ProfileProjectSchema = z.object({
  title: NonEmptyString,
  period: NonEmptyString.optional(),
  role: NonEmptyString.optional(),
  description: NonEmptyString,
  techStack: z.array(NonEmptyString).default([]),
  achievements: NonEmptyString.optional(),
  githubUrl: NonEmptyString.optional(),
});

export const ProfileSchema = z.object({
  name: NonEmptyString,
  title: NonEmptyString,
  summary: NonEmptyString,
  skills: z.array(NonEmptyString).default([]),
  projects: z.array(ProfileProjectSchema).default([]),
});

export type ProfileProject = z.infer<typeof ProfileProjectSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
