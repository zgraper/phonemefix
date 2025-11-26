import { PipelineResponse, RuleConfig, PipelineRequest } from '../types';
import { API_BASE_URL } from '../constants';

/**
 * Simulates the backend latency and processing for demonstration purposes
 * if the backend is offline.
 */
const mockProcessAudio = async (rules: RuleConfig): Promise<PipelineResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulated result based on "rabbit" -> "wabbit" correction logic
      // Scenario: Child says "wabbit", Model hears "w æ b ɪ t"
      // If gliding rule is ON, we might reverse map or mapped purely on input.
      // Based on the prompt's logic (Child -> Adult correction or vice versa),
      // usually these apps take Child Speech -> IPA -> Correct to Adult IPA -> Text.
      
      const isGlidingFixed = rules.gliding;
      
      resolve({
        raw_ipa: "w æ b ɪ t | b l u | s k aɪ", // "wabbit blue sky"
        // If we apply gliding correction (w->r, b->b, s->s)
        corrected_ipa: isGlidingFixed 
          ? "ɹ æ b ɪ t | b l u | s k aɪ" 
          : "w æ b ɪ t | b l u | s k aɪ",
        final_text: isGlidingFixed 
          ? "rabbit blue sky" 
          : "wabbit blue sky",
        rules_applied: rules,
        wav2vec2_model_used: "facebook/wav2vec2-lv-60-espeak-cv-ft"
      });
    }, 2500);
  });
};

export const runPipeline = async (req: PipelineRequest): Promise<PipelineResponse> => {
  const formData = new FormData();
  formData.append('file', req.audioFile);
  formData.append('rules', JSON.stringify(req.rules));

  try {
    // Attempt to reach the real backend
    // Note: using a timeout to fail fast to mock if backend isn't running
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const response = await fetch(`${API_BASE_URL}/pipeline`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Backend unreachable, falling back to simulation mode.", error);
    // Fallback for demo/frontend-only review
    return mockProcessAudio(req.rules);
  }
};