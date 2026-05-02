import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let tempDir: string;
  let profilePath: string;
  let examplePath: string;
  let service: ProfileService;
  const previousEnv = {
    RESUME_MCP_PROFILE_PATH: process.env.RESUME_MCP_PROFILE_PATH,
    RESUME_MCP_EXAMPLE_PATH: process.env.RESUME_MCP_EXAMPLE_PATH,
  };

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'resume-mcp-profile-'));
    profilePath = path.join(tempDir, 'profile.json');
    examplePath = path.join(tempDir, 'profile.example.json');
    await fs.writeFile(
      examplePath,
      JSON.stringify({
        name: '홍길동',
        title: 'Full-stack Developer',
        summary: '2년차 풀스택 개발자입니다.',
        skills: ['NestJS'],
        projects: [
          {
            title: '프로젝트명',
            description: '본인의 기여를 사실 기반으로 설명',
            techStack: ['NestJS'],
            githubUrl: 'https://github.com/username/project',
          },
        ],
      }),
      'utf8',
    );
    process.env.RESUME_MCP_PROFILE_PATH = profilePath;
    process.env.RESUME_MCP_EXAMPLE_PATH = examplePath;
    service = new ProfileService();
  });

  afterEach(async () => {
    if (previousEnv.RESUME_MCP_PROFILE_PATH === undefined) {
      delete process.env.RESUME_MCP_PROFILE_PATH;
    } else {
      process.env.RESUME_MCP_PROFILE_PATH = previousEnv.RESUME_MCP_PROFILE_PATH;
    }
    if (previousEnv.RESUME_MCP_EXAMPLE_PATH === undefined) {
      delete process.env.RESUME_MCP_EXAMPLE_PATH;
    } else {
      process.env.RESUME_MCP_EXAMPLE_PATH = previousEnv.RESUME_MCP_EXAMPLE_PATH;
    }
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('bootstraps profile.json from example when missing', async () => {
    const profile = await service.getProfile();
    const saved = JSON.parse(
      await fs.readFile(profilePath, 'utf8'),
    ) as { name: string };

    expect(profile.name).toBe('홍길동');
    expect(saved.name).toBe('홍길동');
  });

  it('blocks generation when example placeholders remain', async () => {
    await expect(service.getProfileForGeneration()).rejects.toThrow(
      'PROFILE_INCOMPLETE',
    );
  });

  it('allows generation after profile is personalized', async () => {
    await fs.writeFile(
      profilePath,
      JSON.stringify({
        name: '정도연',
        title: 'Backend Developer',
        summary: 'NestJS 기반 API 개발자입니다.',
        skills: ['NestJS', 'TypeScript'],
        projects: [
          {
            title: 'Resume MCP',
            description: 'JD 기반 이력서 생성 도구 개발',
            techStack: ['NestJS', 'TypeScript'],
            achievements: '작성 시간 단축',
            githubUrl: 'https://github.com/doyeonjeong/IT-Resume-MCP',
          },
        ],
      }),
      'utf8',
    );

    const profile = await service.getProfileForGeneration();

    expect(profile.name).toBe('정도연');
  });

  it('resolves default profile path under ~/.resume-mcp', () => {
    delete process.env.RESUME_MCP_PROFILE_PATH;
    expect(ProfileService.resolveProfilePath()).toBe(
      path.join(os.homedir(), '.resume-mcp', 'profile.json'),
    );
  });
});
