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

export interface PipelineRequest {
  audioFile: File;
  rules: RuleConfig;
}

export interface PipelineResponse {
  raw_ipa: string;
  corrected_ipa: string;
  final_text: string;
  rules_applied: RuleConfig;
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