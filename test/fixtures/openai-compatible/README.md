# OpenAI-Compatible Endpoint Fixtures

This directory holds captured `chat.completions` responses from real OpenAI-compatible
endpoints (MLX server, HF Router, etc.). They drive the JSON-contract test in
`json-parser.contract.spec.ts`.

## How to capture a fixture

1. Start the endpoint you want to capture (e.g. `mlx_vlm.server` on port 8080).
2. Run the helper script (or call the endpoint manually) with the actual `analyze_jd`
   prompt against a sample JD.
3. Save the **content string** of `response.choices[0].message.content` to
   `<endpoint-name>-analyze-jd.txt`. The contract test feeds that file through
   `parseJsonFromLLM` and asserts the result conforms to `JdAnalysis`.

Filename convention: `<endpoint>-<tool>.txt`. Examples:
- `mlx-analyze-jd.txt`
- `hf-router-analyze-jd.txt`

When at least one fixture file is present, the contract spec auto-detects and validates
it. Empty directory => spec is a no-op (no failure, no false confidence).
