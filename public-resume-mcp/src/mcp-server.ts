#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResumeService } from './resume/resume.service';
import { ProfileService } from './profile/profile.service';
import { UpdateProfileDto } from './profile/dto/update-profile.dto';
import { createLocalLlmClient } from './llm/local-llm.factory';
import {
  ANALYZE_JD_SYSTEM_PROMPT,
  ANALYZE_JD_USER_PROMPT,
} from './llm/prompts/analyze-jd.prompt';
import {
  MATCH_PROFILE_SYSTEM_PROMPT,
  MATCH_PROFILE_USER_PROMPT,
} from './llm/prompts/match-profile.prompt';
import {
  GENERATE_BULLETS_SYSTEM_PROMPT,
  GENERATE_BULLETS_USER_PROMPT,
} from './llm/prompts/generate-bullets.prompt';
import {
  GENERATE_RESUME_MARKDOWN_SYSTEM_PROMPT,
  GENERATE_RESUME_MARKDOWN_USER_PROMPT,
} from './llm/prompts/generate-resume.prompt';
import { parseJsonFromLLM } from './utils/json-parser';
import type { JdAnalysis } from './domain/jd-analysis';
import type { ProfileMatch, ResumeBullets } from './domain/resume';
import {
  AnalyzeJdArgsSchema,
  GenerateCoverLetterArgsSchema,
  GeneratePortfolioArgsSchema,
  GenerateResumeArgsSchema,
  GenerateResumeBulletsArgsSchema,
  GenerateResumeMarkdownArgsSchema,
  JdAnalysisSchema,
  MatchProfileToJdArgsSchema,
  ProfileMatchSchema,
  ResumeBulletsSchema,
  UpdateProfileArgsSchema,
  parseToolArgs,
  validateToolOutput,
} from './mcp/mcp-tool.schemas';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const resumeService = app.get(ResumeService);
  const profileService = app.get(ProfileService);
  const localLlm = createLocalLlmClient();

  // Helper: build profile context string for local LLM prompts
  const buildProfileContext = async (): Promise<{
    text: string;
    name: string;
    title: string;
  }> => {
    const profile = await profileService.getProfileForGeneration();
    return {
      text: profileService.buildProfileContext(profile),
      name: profile.name,
      title: profile.title,
    };
  };

  // --- MCP Server ---
  const server = new Server(
    {
      name: 'resume-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => {
    return {
      tools: [
        {
          name: 'get_profile',
          description: '현재 저장된 내 프로필 정보를 가져옵니다.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'update_profile',
          description: '내 프로필 정보를 업데이트합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              title: { type: 'string' },
              summary: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } },
              projects: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    period: { type: 'string' },
                    role: { type: 'string' },
                    description: { type: 'string' },
                    techStack: { type: 'array', items: { type: 'string' } },
                    achievements: { type: 'string' },
                    githubUrl: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        {
          name: 'generate_resume',
          description: '채용 공고(JD)를 바탕으로 맞춤형 이력서를 생성합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              position: { type: 'string', description: '지원하는 직무' },
              jdText: { type: 'string', description: '채용 공고 내용' },
              companyName: { type: 'string', description: '회사 이름' },
              language: {
                type: 'string',
                description: '언어 (Korean/English)',
                default: 'Korean',
              },
            },
            required: ['position', 'jdText'],
          },
        },
        {
          name: 'generate_portfolio',
          description: '내 프로필을 바탕으로 포트폴리오 요약본을 생성합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              language: {
                type: 'string',
                description: '언어 (Korean/English)',
                default: 'Korean',
              },
            },
          },
        },
        {
          name: 'generate_cover_letter',
          description:
            '채용 공고(JD)를 바탕으로 자기소개서(Cover Letter)를 생성합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              position: { type: 'string', description: '지원하는 직무' },
              jdText: { type: 'string', description: '채용 공고 내용' },
              companyName: { type: 'string', description: '회사 이름' },
              language: {
                type: 'string',
                description: '언어 (Korean/English)',
                default: 'Korean',
              },
            },
            required: ['position', 'jdText', 'companyName'],
          },
        },
        // --- Local LLM Tools (Ollama) ---
        {
          name: 'analyze_jd',
          description:
            'JD(채용 공고) 텍스트를 분석하여 구조화된 JSON으로 변환합니다. (Local LLM)',
          inputSchema: {
            type: 'object',
            properties: {
              jdText: { type: 'string', description: '채용 공고 전문' },
              language: {
                type: 'string',
                description: '응답 언어 (ko/en)',
                default: 'ko',
              },
            },
            required: ['jdText'],
          },
        },
        {
          name: 'match_profile_to_jd',
          description:
            'JD 분석 결과와 내 프로필을 비교하여 강조할 포인트를 도출합니다. (Local LLM)',
          inputSchema: {
            type: 'object',
            properties: {
              jdAnalysis: {
                type: 'object',
                description: 'analyze_jd의 출력 결과',
              },
              language: {
                type: 'string',
                description: '응답 언어 (ko/en)',
                default: 'ko',
              },
            },
            required: ['jdAnalysis'],
          },
        },
        {
          name: 'generate_resume_bullets',
          description:
            'JD에 맞는 이력서 bullet을 생성합니다. 과장 금지, 사실 기반. (Local LLM)',
          inputSchema: {
            type: 'object',
            properties: {
              jdAnalysis: {
                type: 'object',
                description: 'analyze_jd의 출력 결과',
              },
              language: {
                type: 'string',
                description: '언어 (ko/en)',
                default: 'ko',
              },
              tone: {
                type: 'string',
                description: '톤 (concise/professional/startup)',
                default: 'professional',
              },
            },
            required: ['jdAnalysis'],
          },
        },
        {
          name: 'generate_resume_markdown',
          description:
            'bullet 데이터를 ATS 친화적인 최종 이력서 Markdown으로 변환합니다. (Local LLM)',
          inputSchema: {
            type: 'object',
            properties: {
              resumeData: {
                type: 'object',
                description: 'generate_resume_bullets의 출력 결과',
              },
              template: {
                type: 'string',
                description: '템플릿 (ios/backend/fullstack/ai-agent/general)',
                default: 'general',
              },
            },
            required: ['resumeData'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      switch (request.params.name) {
        case 'get_profile': {
          const profile = await profileService.getProfile();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(profile, null, 2),
              },
            ],
          };
        }

        case 'update_profile': {
          const args = parseToolArgs(
            'update_profile',
            UpdateProfileArgsSchema,
            request.params.arguments,
          ) as UpdateProfileDto;
          await profileService.updateProfile(args);
          return {
            content: [
              {
                type: 'text',
                text: '프로필이 성공적으로 업데이트되었습니다.',
              },
            ],
          };
        }

        case 'generate_resume': {
          const args = parseToolArgs(
            'generate_resume',
            GenerateResumeArgsSchema,
            request.params.arguments,
          );
          const resume = await resumeService.generateResume({
            position: args.position,
            jdText: args.jdText,
            companyName: args.companyName,
            language: args.language ?? 'ko',
          });
          return {
            content: [
              {
                type: 'text',
                text: resume,
              },
            ],
          };
        }

        case 'generate_portfolio': {
          const args = parseToolArgs(
            'generate_portfolio',
            GeneratePortfolioArgsSchema,
            request.params.arguments,
          );
          const portfolio = await resumeService.generatePortfolio({
            language: args.language ?? 'ko',
          });
          return {
            content: [
              {
                type: 'text',
                text: portfolio,
              },
            ],
          };
        }

        case 'generate_cover_letter': {
          const args = parseToolArgs(
            'generate_cover_letter',
            GenerateCoverLetterArgsSchema,
            request.params.arguments,
          );
          const coverLetter = await resumeService.generateCoverLetter({
            position: args.position,
            jdText: args.jdText,
            companyName: args.companyName,
            language: args.language ?? 'ko',
          });
          return {
            content: [
              {
                type: 'text',
                text: coverLetter,
              },
            ],
          };
        }

        // --- Local LLM Tool Handlers ---
        case 'analyze_jd': {
          const args = parseToolArgs(
            'analyze_jd',
            AnalyzeJdArgsSchema,
            request.params.arguments,
          );
          const lang = args.language ?? 'ko';
          const result = await localLlm.chat({
            system: ANALYZE_JD_SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content: ANALYZE_JD_USER_PROMPT(args.jdText, lang),
              },
            ],
            temperature: 0.3,
          });
          const parsed = validateToolOutput(
            'analyze_jd',
            JdAnalysisSchema,
            parseJsonFromLLM<JdAnalysis>(result.content),
          );
          return {
            content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }],
          };
        }

        case 'match_profile_to_jd': {
          const args = parseToolArgs(
            'match_profile_to_jd',
            MatchProfileToJdArgsSchema,
            request.params.arguments,
          );
          const lang = args.language ?? 'ko';
          const { text: profileText } = await buildProfileContext();
          const result = await localLlm.chat({
            system: MATCH_PROFILE_SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content: MATCH_PROFILE_USER_PROMPT(
                  JSON.stringify(args.jdAnalysis, null, 2),
                  profileText,
                  lang,
                ),
              },
            ],
            temperature: 0.3,
          });
          const parsed = validateToolOutput(
            'match_profile_to_jd',
            ProfileMatchSchema,
            parseJsonFromLLM<ProfileMatch>(result.content),
          );
          return {
            content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }],
          };
        }

        case 'generate_resume_bullets': {
          const args = parseToolArgs(
            'generate_resume_bullets',
            GenerateResumeBulletsArgsSchema,
            request.params.arguments,
          );
          const lang = args.language ?? 'ko';
          const tone = args.tone ?? 'professional';
          const { text: profileText } = await buildProfileContext();
          const result = await localLlm.chat({
            system: GENERATE_BULLETS_SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content: GENERATE_BULLETS_USER_PROMPT(
                  JSON.stringify(args.jdAnalysis, null, 2),
                  profileText,
                  lang,
                  tone,
                ),
              },
            ],
            temperature: 0.5,
          });
          const parsed = validateToolOutput(
            'generate_resume_bullets',
            ResumeBulletsSchema,
            parseJsonFromLLM<ResumeBullets>(result.content),
          );
          return {
            content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }],
          };
        }

        case 'generate_resume_markdown': {
          const args = parseToolArgs(
            'generate_resume_markdown',
            GenerateResumeMarkdownArgsSchema,
            request.params.arguments,
          );
          const template = args.template ?? 'general';
          const { name, title } = await buildProfileContext();
          const result = await localLlm.chat({
            system: GENERATE_RESUME_MARKDOWN_SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content: GENERATE_RESUME_MARKDOWN_USER_PROMPT(
                  JSON.stringify(args.resumeData, null, 2),
                  template,
                  name,
                  title,
                ),
              },
            ],
            temperature: 0.4,
          });
          return {
            content: [{ type: 'text', text: result.content }],
          };
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`,
          );
      }
    } catch (error) {
      if (error instanceof McpError) throw error;
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

bootstrap().catch(console.error);
