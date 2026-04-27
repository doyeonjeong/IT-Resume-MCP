import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseJsonFromLLM } from './json-parser';

const FIXTURE_DIR = path.resolve(
  __dirname,
  '../../test/fixtures/openai-compatible',
);

function listFixtureFiles(): string[] {
  if (!fs.existsSync(FIXTURE_DIR)) return [];
  return fs
    .readdirSync(FIXTURE_DIR)
    .filter((f) => f.endsWith('.txt'))
    .map((f) => path.join(FIXTURE_DIR, f));
}

describe('json-parser contract — captured OpenAI-compatible responses', () => {
  const fixtures = listFixtureFiles();

  if (fixtures.length === 0) {
    it.skip('no fixtures present (capture one via test/fixtures/openai-compatible/README.md)', () => {
      expect(true).toBe(true);
    });
    return;
  }

  for (const fixturePath of fixtures) {
    const name = path.basename(fixturePath);
    it(`parses ${name} as valid JSON`, () => {
      const raw = fs.readFileSync(fixturePath, 'utf8');
      const parsed = parseJsonFromLLM(raw);
      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe('object');
    });
  }
});
