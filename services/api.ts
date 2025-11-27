import { PipelineResponse, RuleConfig, PipelineRequest } from '../types';
import { API_BASE_URL } from '../constants';


export const runPipeline = async (req: PipelineRequest): Promise<PipelineResponse> => {
  const formData = new FormData();
  formData.append('file', req.audioFile);
  formData.append('rules', JSON.stringify(req.rules));

  const response = await fetch (`${API_BASE_URL}/pipeline`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(`Server error: ${response.status} - ${msg}`);
  }

  return await response.json();
};