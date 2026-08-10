/**
 * Real client against Anthropic's /v1/messages API. Written against
 * the documented request/response shape, not run against it (no
 * network access in this build sandbox). Verify once you have a
 * real ANTHROPIC_API_KEY.
 *
 * Model default is Haiku, not Sonnet/Opus — this runs on every
 * research request (if configured), so cost/latency matter more
 * here than raw quality. Swap ANTHROPIC_MODEL in .env if you want
 * higher quality at higher cost.
 */
export class AnthropicClient {

    async complete(systemPrompt: string, userPrompt: string): Promise<string> {

        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            throw new Error("ANTHROPIC_API_KEY is missing.");
        }

        const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model,
                max_tokens: 300,
                system: systemPrompt,
                messages: [{ role: "user", content: userPrompt }],
            }),
        });

        if (!response.ok) {
            throw new Error(`Anthropic API request failed: ${response.status}`);
        }

        const data = await response.json();

        const text = data.content
            ?.filter((block: { type: string }) => block.type === "text")
            ?.map((block: { text: string }) => block.text)
            ?.join("");

        if (!text) {
            throw new Error("Anthropic API returned no text content.");
        }

        return text;
    }

}
