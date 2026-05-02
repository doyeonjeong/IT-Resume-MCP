import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      name: 'resume-mcp',
      status: 'ok',
      transport: ['mcp-stdio', 'http'],
      tools: [
        'get_profile',
        'update_profile',
        'generate_resume',
        'generate_portfolio',
        'generate_cover_letter',
        'analyze_jd',
        'match_profile_to_jd',
        'generate_resume_bullets',
        'generate_resume_markdown',
      ],
    };
  }
}
