export interface JdAnalysis {
  roleTitle: string;
  companyType: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  keywords: string[];
  seniority: 'junior' | 'mid' | 'senior' | 'unknown';
  atsKeywords: string[];
  riskFactors: string[];
}
