export interface ProfileMatch {
  strongMatches: string[];
  partialMatches: string[];
  missingButRecoverable: string[];
  doNotOverclaim: string[];
  recommendedPositioning: string;
}

export interface ResumeBullets {
  summary: string;
  skills: string[];
  experienceBullets: string[];
  projectBullets: string[];
  coverLetterHooks: string[];
  needsUserInput?: string[];
}

export interface ResumeMarkdown {
  markdown: string;
}
