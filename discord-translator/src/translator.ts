import Anthropic from "@anthropic-ai/sdk";
import type { Lang } from "./lang";

const LABEL: Record<Lang, string> = { ko: "Korean", en: "English", other: "auto" };

export async function translate(
  text: string,
  from: Lang,
  to: Lang,
  apiKey: string,
  model: string,
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const fromL = LABEL[from];
  const toL = LABEL[to];

  const msg = await client.messages.create({
    model,
    max_tokens: 1024,
    system:
      `You are a translator. Translate the user message from ${fromL} to ${toL}. ` +
      `Output ONLY the translation, no quotes, no explanations, no prefix. ` +
      `Preserve Discord mentions (<@123>, <#456>), custom emoji (<:name:123>), ` +
      `and standard emoji exactly as-is. Keep tone and slang natural.`,
    messages: [{ role: "user", content: text }],
  });

  const block = msg.content[0];
  if (block.type !== "text") throw new Error("unexpected content block");
  return block.text.trim();
}
