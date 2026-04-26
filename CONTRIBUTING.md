# Contributing to IT-Resume-MCP

Thanks for your interest in contributing.

## How to contribute

This is primarily a personal portfolio project. External contributions are
welcome but not actively maintained — please open an issue first if you plan
substantial changes so we can confirm whether the direction fits the project.

### Reporting issues

- Check existing issues before opening a new one
- Provide a minimal reproduction (Node version, command, observed vs expected)
- For LLM-related issues, include which provider you used (Cloud / Ollama / HF)

### Pull requests

1. Fork and create a feature branch from `main`
2. Keep changes focused — one PR per topic
3. Run `npm test -- --runInBand` and `npm run build` from `public-resume-mcp/`
4. Update relevant docs (README, DEV-PLAN if behavior changes)
5. Open the PR with a clear description of *why* the change is needed

### Code style

- TypeScript, follows the repo's `eslint.config.mjs` and `.prettierrc`
- NestJS conventions (modules, services, providers)
- Keep MCP tool schemas in sync with their handler implementations

## Development setup

See `README.md` "현재 상태" for build/test commands and `public-resume-mcp/env.example`
for required environment variables.

## Security

If you find a vulnerability (e.g., prompt-injection vector, secret leak path),
please email the maintainer privately rather than opening a public issue.

## License

By contributing, you agree your contributions will be licensed under the MIT
License (see `LICENSE`).
