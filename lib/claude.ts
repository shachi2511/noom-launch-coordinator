import Anthropic from "@anthropic-ai/sdk";

/**
 * Every agent call in this app reads the model name from this env var — nothing
 * hardcodes a model string. Defaults to Anthropic's current fastest/cheapest model.
 */
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5";

let cachedClient: Anthropic | null = null;

/**
 * Lazily construct the Anthropic client. Lazy so that importing this module
 * (e.g. from a test file) never throws just because ANTHROPIC_API_KEY isn't set —
 * the error only surfaces when an agent actually tries to make a call.
 */
function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local locally, or to your Vercel project's Environment Variables in production."
    );
  }
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey });
  }
  return cachedClient;
}

interface ToolUseBlockLike {
  type: "tool_use";
  name: string;
  input: unknown;
}

interface StructuredCallOptions<T> {
  /** System prompt describing the agent's role and how it should decide. */
  system: string;
  /** The user-turn content: team context + the request to evaluate. */
  userMessage: string;
  /** Name of the synthetic tool Claude is forced to call — this is what enforces the JSON shape. */
  toolName: string;
  toolDescription: string;
  /** JSON Schema for the tool's input, i.e. the shape we require back. */
  inputSchema: Record<string, unknown>;
  /** Runtime type guard — re-validates the parsed object beyond what JSON Schema alone caught. */
  validate: (obj: unknown) => obj is T;
  /** How many *extra* attempts to make if validation fails. Default 1 (so: 2 attempts total). */
  maxRetries?: number;
  maxTokens?: number;
}

/**
 * Calls Claude with a single enforced tool (tool_choice pinned to it), so the model has no
 * path to reply with free text — it must produce arguments matching inputSchema. If the
 * returned arguments fail our own runtime validation, we retry once with a corrective note
 * appended, rather than silently passing through malformed data.
 */
export async function callClaudeStructured<T>(opts: StructuredCallOptions<T>): Promise<T> {
  const {
    system,
    userMessage,
    toolName,
    toolDescription,
    inputSchema,
    validate,
    maxRetries = 1,
    maxTokens = 1024,
  } = opts;

  const client = getClient();
  let lastError: unknown = null;
  let effectiveUserMessage = userMessage;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: effectiveUserMessage }],
        tools: [
          {
            name: toolName,
            description: toolDescription,
            // eslint-disable-next-line
            input_schema: inputSchema as any,
          },
        ],
        tool_choice: { type: "tool", name: toolName },
      });

      const toolUseBlock = response.content.find(
        (block): block is ToolUseBlockLike =>
          (block as { type?: string }).type === "tool_use"
      );

      if (!toolUseBlock) {
        throw new Error("Claude responded without calling the required tool.");
      }

      if (validate(toolUseBlock.input)) {
        return toolUseBlock.input;
      }

      throw new Error(
        `Structured output failed schema validation: ${JSON.stringify(toolUseBlock.input)}`
      );
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        // Give the retry a nudge about what went wrong, rather than repeating the identical call.
        effectiveUserMessage = `${userMessage}\n\n(Your previous response did not match the required JSON shape exactly. Double-check every field name, enum value, and type, then call the ${toolName} tool again.)`;
        continue;
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`callClaudeStructured("${toolName}") failed after ${maxRetries + 1} attempt(s): ${message}`);
}
