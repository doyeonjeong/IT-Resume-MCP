import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  const originalCwd = process.cwd();
  let tempDir: string;
  let service: ProfileService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'resume-mcp-profile-'));
    await fs.mkdir(path.join(tempDir, 'data'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, 'data', 'profile.example.json'),
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
    process.chdir(tempDir);
    service = new ProfileService();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('bootstraps profile.json from example when missing', async () => {
    const profile = await service.getProfile();
    const saved = JSON.parse(
      await fs.readFile(path.join(tempDir, 'data', 'profile.json'), 'utf8'),
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
      path.join(tempDir, 'data', 'profile.json'),
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
});
