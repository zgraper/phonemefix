export interface RuleSubrule {
  label: string;
  active: boolean;
}

export interface RuleCategory {
  label: string;
  selectAll: boolean;
  subrules: Record<string, RuleSubrule>;
}

export interface RuleConfig {
  gliding: RuleCategory;
  stopping: RuleCategory;
  cluster_reduction: RuleCategory;
  final_consonant_deletion: RuleCategory;
}

export interface GlidingRulesPayload {
  w_to_r: boolean;
  l_to_w: boolean;
  r_to_w: boolean;
}

export interface StoppingRulesPayload {
  s_to_t: boolean;
  z_to_d: boolean;
}

export interface RulesPayload {
  gliding: GlidingRulesPayload;
  stopping: StoppingRulesPayload;
  cluster_reduction: boolean;
  final_consonant_deletion: boolean;
}

export interface PipelineRequest {
  audioFile: File;
  rules: RulesPayload;
}

export interface PipelineResponse {
  raw_ipa: string;
  corrected_ipa: string;
  final_text: string;
  rules_applied: RulesPayload;
  wav2vec2_model_used?: string;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PHONEMIZING = 'PHONEMIZING',
  CORRECTING = 'CORRECTING',
  DECODING = 'DECODING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}