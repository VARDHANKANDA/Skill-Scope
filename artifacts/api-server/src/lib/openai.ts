import OpenAI from "openai";

let _client: OpenAI | null = null;

/** Returns a shared OpenAI client. Throws only when called, not at import time. */
export function getOpenAI(): OpenAI {
  if (_client) return _client;
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set. Add it to your secrets.");
  }
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

/** Convenience alias used in routes that call getOpenAI() inline. */
export const openai = {
  get chat() { return getOpenAI().chat; },
};
