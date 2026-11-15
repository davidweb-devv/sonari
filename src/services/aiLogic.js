import { processAiPrompt } from "./aiService";

export async function generateAiResponse(
  prompt = "",
  playerState = {},
  libraryState = {}
) {
  return processAiPrompt(prompt, playerState, libraryState);
}