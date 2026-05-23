export interface SafetyScore {
  crisisDetected: boolean;
  score: number;
  triggerWords: string[];
}

const CRISIS_LEXICON = new Set([
  'suicide', 'kill myself', 'end my life', 'want to die', 
  'self harm', 'cutting myself', 'swallow pills', 'overdose'
]);

/**
 * Analyzes chat text inputs locally within the browser thread to protect user privacy
 */
export async function analyzeTextLocally(text: string): Promise<SafetyScore> {
  const normalized = text.toLowerCase().trim();
  const triggerWords: string[] = [];
  let matchCount = 0;

  CRISIS_LEXICON.forEach(indicator => {
    if (normalized.includes(indicator)) {
      matchCount++;
      triggerWords.push(indicator);
    }
  });

  return {
    crisisDetected: matchCount > 0,
    score: matchCount * 10,
    triggerWords
  };
}
