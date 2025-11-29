export const API_BASE_URL = '';

export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const SUPPORTED_FORMATS = [
  'audio/wav',
  'audio/mpeg', // mp3
  'audio/mp4',  // m4a
  'audio/x-m4a',
  'audio/flac',
  'audio/ogg',
  'audio/x-wav'
];

export const DEFAULT_RULES = {
  gliding: {
    label: "Gliding",
    selectAll: false,
    subrules: {
      w_to_r: { label: "/w/ → /r/", active: false },
      l_to_w: { label: "/l/ → /w/", active: false },
      r_to_w: { label: "/r/ → /w/", active: false }
    }
  },

  stopping: {
    label: "Stopping",
    selectAll: false,
    subrules: {
      s_to_t: { label: "/s/ → /t/", active: false },
      z_to_d: { label: "/z/ → /d/", active: false }
      // Add more as needed
    }
  },

  cluster_reduction: {
    label: 'Cluster Reduction',
    selectAll: false,
    subrules: {}
  }
};

export const RULE_DESCRIPTIONS = {
  gliding: "Replaces liquids /r, l/ with glides /w, j/ based on context (e.g., 'rabbit' → 'wabbit').",
  stopping: "Replaces fricatives/affricates with stops (e.g., 'fun' → 'pun', 'very' → 'bery').",
  cluster_reduction: "Simplifies consonant clusters to single consonants (e.g., 'spoon' → 'poon')."
};