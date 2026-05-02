import { Injectable } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {
  ProfileSchema,
  type Profile,
  type ProfileProject,
} from './profile.schema';

export type { Profile, ProfileProject as Project };

@Injectable()
export class ProfileService {
  private readonly dataPath: string;
  private readonly exampleDataPath: string;

  constructor() {
    this.dataPath = ProfileService.resolveProfilePath();
    this.exampleDataPath = ProfileService.resolveExamplePath();
  }

  static resolveProfilePath(): string {
    if (process.env.RESUME_MCP_PROFILE_PATH) {
      return path.resolve(process.env.RESUME_MCP_PROFILE_PATH);
    }
    return path.join(os.homedir(), '.resume-mcp', 'profile.json');
  }

  static resolveExamplePath(): string {
    if (process.env.RESUME_MCP_EXAMPLE_PATH) {
      return path.resolve(process.env.RESUME_MCP_EXAMPLE_PATH);
    }
    return path.resolve(
      __dirname,
      '..',
      '..',
      'data',
      'profile.example.json',
    );
  }

  private async ensureProfileFileExists(): Promise<void> {
    await fs.mkdir(path.dirname(this.dataPath), { recursive: true });

    try {
      await fs.access(this.dataPath);
    } catch {
      await fs.copyFile(this.exampleDataPath, this.dataPath);
    }
  }

  private collectReadinessIssues(profile: Profile): string[] {
    const issues: string[] = [];

    if (profile.skills.length === 0) issues.push('skills');
    if (profile.projects.length === 0) issues.push('projects');

    const placeholderChecks: Array<[boolean, string]> = [
      [profile.name === '홍길동', 'name'],
      [
        profile.summary ===
          '2년차 풀스택 개발자입니다. 백엔드 API 설계와 모바일 앱 개발 경험이 있습니다.',
        'summary',
      ],
      [
        profile.projects.some((project) =>
          project.title.includes('프로젝트명'),
        ),
        'projects.title',
      ],
      [
        profile.projects.some((project) =>
          project.description.includes('본인의 기여'),
        ),
        'projects.description',
      ],
      [
        profile.projects.some(
          (project) => project.githubUrl?.includes('username/project') ?? false,
        ),
        'projects.githubUrl',
      ],
    ];

    for (const [isPlaceholder, field] of placeholderChecks) {
      if (isPlaceholder)
        issues.push(`${field} contains example placeholder text`);
    }

    return issues;
  }

  async getProfile(): Promise<Profile> {
    await this.ensureProfileFileExists();
    const data = await fs.readFile(this.dataPath, 'utf8');
    const parsed = JSON.parse(data) as unknown;
    return ProfileSchema.parse(parsed);
  }

  async getProfileForGeneration(): Promise<Profile> {
    const profile = await this.getProfile();
    const issues = this.collectReadinessIssues(profile);

    if (issues.length > 0) {
      throw new Error(
        `PROFILE_INCOMPLETE: ${this.dataPath} must be personalized before generation. Fix: ${issues.join(', ')}`,
      );
    }

    return profile;
  }

  buildProfileContext(profile: Profile): string {
    const projects = profile.projects
      .map((project: ProfileProject) => {
        const lines = [`### ${project.title}`];
        if (project.period) lines.push(`- 기간: ${project.period}`);
        if (project.role) lines.push(`- 역할: ${project.role}`);
        lines.push(`- 설명: ${project.description}`);
        lines.push(`- 기술 스택: ${project.techStack.join(', ')}`);
        if (project.achievements) lines.push(`- 성과: ${project.achievements}`);
        if (project.githubUrl) lines.push(`- GitHub: ${project.githubUrl}`);
        return lines.join('\n');
      })
      .join('\n\n');

    return `이름: ${profile.name}
직무: ${profile.title}
자기소개: ${profile.summary}
보유 기술: ${profile.skills.join(', ')}

프로젝트 경험:
${projects}`;
  }

  async updateProfile(dto: UpdateProfileDto): Promise<Profile> {
    await this.ensureProfileFileExists();
    const currentProfile = await this.getProfile();
    const updatedProfile = ProfileSchema.parse({
      ...currentProfile,
      ...dto,
      skills: dto.skills || currentProfile.skills,
      projects: dto.projects
        ? dto.projects.map((p) => ({
            ...p,
            techStack: p.techStack || [],
          }))
        : currentProfile.projects,
    });

    await fs.writeFile(
      this.dataPath,
      JSON.stringify(updatedProfile, null, 2),
      'utf8',
    );
    return updatedProfile;
  }
}
