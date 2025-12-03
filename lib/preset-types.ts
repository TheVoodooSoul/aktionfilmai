// Fight Scene Preset Types for CineKinetic/AktionFilm
// Presets are like Higgsfield/Wan templates - user picks a preset, loads character, applies

export type PresetCategory =
  | 'punch'
  | 'kick'
  | 'takedown'
  | 'combo'
  | 'grapple'
  | 'weapon'
  | 'block'
  | 'dodge';

export type PresetStyle =
  | 'cinematic'
  | 'noir'
  | 'cyberpunk'
  | 'anime'
  | 'epic'
  | 'vintage'
  | 'neon'
  | 'golden-hour'
  | 'urban';

export interface FightPreset {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  style: PresetStyle;

  // Visual assets
  thumbnail_url: string;        // Preview image
  preview_video_url?: string;   // Preview video (3-5 sec loop)

  // Generation settings
  master_prompt: string;        // Base prompt for this fight move
  negative_prompt: string;
  lora_name?: string;           // e.g., "punch_wan22.safetensors"
  lora_strength: number;        // 0.0 - 1.0

  // ControlNet data (extracted from reference video)
  controlnet_data?: {
    video_path?: string;
    pose_map?: string;
    depth_map?: string;
    canny_map?: string;
  };

  // Generation params
  num_frames: number;           // Video length
  fps: number;
  guidance_scale: number;

  // Metadata
  credits_cost: number;
  uses_count: number;
  rating: number;               // 1-5 stars
  is_public: boolean;
  is_featured: boolean;

  // Ownership
  created_by: string;           // User ID
  created_at: string;
  updated_at: string;

  // Tags for search
  tags: string[];
}

// Hardcoded fight presets for launch
export const FIGHT_PRESETS: FightPreset[] = [
  // === PUNCHES ===
  {
    id: 'punch-jab-01',
    name: 'Quick Jab',
    description: 'Fast straight punch to the face',
    category: 'punch',
    style: 'cinematic',
    thumbnail_url: '/presets/punch-jab.jpg',
    preview_video_url: '/presets/punch-jab.mp4',
    master_prompt: 'A fighter throws a quick jab punch, fast straight punch to face, boxing style, cinematic lighting',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'punch_wan22.safetensors',
    lora_strength: 0.8,
    num_frames: 49,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 40,
    uses_count: 0,
    rating: 4.5,
    is_public: true,
    is_featured: true,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['jab', 'boxing', 'fast', 'straight'],
  },
  {
    id: 'punch-hook-01',
    name: 'Power Hook',
    description: 'Wide arcing hook punch',
    category: 'punch',
    style: 'cinematic',
    thumbnail_url: '/presets/punch-hook.jpg',
    master_prompt: 'A fighter throws a powerful hook punch, wide arcing swing, boxing knockout, dramatic slow motion',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'punch_wan22.safetensors',
    lora_strength: 0.85,
    num_frames: 49,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 40,
    uses_count: 0,
    rating: 4.8,
    is_public: true,
    is_featured: true,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['hook', 'boxing', 'power', 'knockout'],
  },
  {
    id: 'punch-uppercut-01',
    name: 'Rising Uppercut',
    description: 'Explosive upward punch',
    category: 'punch',
    style: 'cinematic',
    thumbnail_url: '/presets/punch-uppercut.jpg',
    master_prompt: 'A fighter throws a devastating uppercut, rising punch from below, knockout blow, dramatic impact',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'punch_wan22.safetensors',
    lora_strength: 0.85,
    num_frames: 49,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 40,
    uses_count: 0,
    rating: 4.7,
    is_public: true,
    is_featured: false,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['uppercut', 'boxing', 'power', 'rising'],
  },
  {
    id: 'punch-overhand-01',
    name: 'Alpha Charge',
    description: 'Overhand right that drops opponent',
    category: 'punch',
    style: 'cinematic',
    thumbnail_url: '/presets/punch-overhand.jpg',
    master_prompt: 'Two men fighting, one throws a devastating overhand right punch knocking the other man down, MMA style',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'punch_wan22.safetensors',
    lora_strength: 0.9,
    num_frames: 49,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 45,
    uses_count: 0,
    rating: 4.9,
    is_public: true,
    is_featured: true,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['overhand', 'mma', 'knockout', 'power'],
  },

  // === KICKS ===
  {
    id: 'kick-roundhouse-01',
    name: 'Roundhouse Kick',
    description: 'Classic spinning roundhouse kick',
    category: 'kick',
    style: 'cinematic',
    thumbnail_url: '/presets/kick-roundhouse.jpg',
    master_prompt: 'A fighter throws a powerful roundhouse kick, spinning leg strike, martial arts, cinematic action',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'kick_wan22.safetensors',
    lora_strength: 0.85,
    num_frames: 49,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 45,
    uses_count: 0,
    rating: 4.6,
    is_public: true,
    is_featured: true,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['roundhouse', 'spinning', 'martial arts', 'kick'],
  },
  {
    id: 'kick-front-01',
    name: 'Front Snap Kick',
    description: 'Quick front kick to midsection',
    category: 'kick',
    style: 'cinematic',
    thumbnail_url: '/presets/kick-front.jpg',
    master_prompt: 'A fighter throws a fast front kick, snapping kick to body, karate style, precise technique',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'kick_wan22.safetensors',
    lora_strength: 0.8,
    num_frames: 49,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 40,
    uses_count: 0,
    rating: 4.4,
    is_public: true,
    is_featured: false,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['front kick', 'snap', 'karate', 'fast'],
  },
  {
    id: 'kick-sidekick-01',
    name: 'Side Kick',
    description: 'Powerful sidekick thrust',
    category: 'kick',
    style: 'cinematic',
    thumbnail_url: '/presets/kick-side.jpg',
    master_prompt: 'A fighter executes a devastating side kick, thrusting leg strike, powerful push kick, martial arts',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'kick_wan22.safetensors',
    lora_strength: 0.85,
    num_frames: 49,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 45,
    uses_count: 0,
    rating: 4.5,
    is_public: true,
    is_featured: false,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['side kick', 'thrust', 'power', 'martial arts'],
  },
  {
    id: 'kick-head-01',
    name: 'Head Kick KO',
    description: 'High kick to the head, knockout',
    category: 'kick',
    style: 'cinematic',
    thumbnail_url: '/presets/kick-head.jpg',
    master_prompt: 'A fighter lands a devastating high kick to opponents head, knockout blow, dramatic impact, slow motion',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'kick_wan22.safetensors',
    lora_strength: 0.9,
    num_frames: 49,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 50,
    uses_count: 0,
    rating: 4.9,
    is_public: true,
    is_featured: true,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['head kick', 'knockout', 'high kick', 'mma'],
  },

  // === TAKEDOWNS ===
  {
    id: 'takedown-single-01',
    name: 'Single Leg Takedown',
    description: 'Classic wrestling single leg',
    category: 'takedown',
    style: 'cinematic',
    thumbnail_url: '/presets/takedown-single.jpg',
    master_prompt: 'A fighter shoots for a single leg takedown, grabbing opponents leg and driving through, wrestling technique',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'takedown_wan22.safetensors',
    lora_strength: 0.85,
    num_frames: 49,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 50,
    uses_count: 0,
    rating: 4.7,
    is_public: true,
    is_featured: true,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['single leg', 'wrestling', 'grappling', 'takedown'],
  },
  {
    id: 'takedown-double-01',
    name: 'Double Leg Blast',
    description: 'Explosive double leg takedown',
    category: 'takedown',
    style: 'cinematic',
    thumbnail_url: '/presets/takedown-double.jpg',
    master_prompt: 'A fighter explodes into a double leg takedown, driving through opponents hips, powerful wrestling slam',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'takedown_wan22.safetensors',
    lora_strength: 0.85,
    num_frames: 49,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 50,
    uses_count: 0,
    rating: 4.8,
    is_public: true,
    is_featured: true,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['double leg', 'wrestling', 'blast', 'slam'],
  },
  {
    id: 'takedown-suplex-01',
    name: 'German Suplex',
    description: 'Dramatic suplex throw',
    category: 'takedown',
    style: 'cinematic',
    thumbnail_url: '/presets/takedown-suplex.jpg',
    master_prompt: 'A fighter executes a powerful suplex, lifting opponent overhead and slamming them down, wrestling throw',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'takedown_wan22.safetensors',
    lora_strength: 0.9,
    num_frames: 49,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 55,
    uses_count: 0,
    rating: 4.9,
    is_public: true,
    is_featured: true,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['suplex', 'wrestling', 'throw', 'slam'],
  },

  // === COMBOS ===
  {
    id: 'combo-one-two-01',
    name: 'One-Two Combo',
    description: 'Classic jab-cross combination',
    category: 'combo',
    style: 'cinematic',
    thumbnail_url: '/presets/combo-one-two.jpg',
    master_prompt: 'A fighter throws a quick jab followed by a powerful cross, one-two boxing combination, fluid technique',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'punch_wan22.safetensors',
    lora_strength: 0.85,
    num_frames: 65,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 55,
    uses_count: 0,
    rating: 4.7,
    is_public: true,
    is_featured: true,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['combo', 'one-two', 'boxing', 'jab cross'],
  },
  {
    id: 'combo-kick-punch-01',
    name: 'Kick-Punch Combo',
    description: 'Low kick into hook punch',
    category: 'combo',
    style: 'cinematic',
    thumbnail_url: '/presets/combo-kick-punch.jpg',
    master_prompt: 'A fighter throws a low kick to leg followed by a hook punch, mixed martial arts combination, fluid attack',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'combo_wan22.safetensors',
    lora_strength: 0.85,
    num_frames: 65,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 60,
    uses_count: 0,
    rating: 4.8,
    is_public: true,
    is_featured: false,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['combo', 'kick punch', 'mma', 'mixed'],
  },

  // === BLOCKS/DODGES ===
  {
    id: 'dodge-slip-01',
    name: 'Head Slip',
    description: 'Slipping a punch, counter ready',
    category: 'dodge',
    style: 'cinematic',
    thumbnail_url: '/presets/dodge-slip.jpg',
    master_prompt: 'A boxer slips a punch by moving head offline, defensive boxing movement, dodge and counter setup',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'dodge_wan22.safetensors',
    lora_strength: 0.8,
    num_frames: 49,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 35,
    uses_count: 0,
    rating: 4.3,
    is_public: true,
    is_featured: false,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['slip', 'dodge', 'boxing', 'defense'],
  },
  {
    id: 'block-parry-01',
    name: 'Parry Counter',
    description: 'Parry punch and counter',
    category: 'block',
    style: 'cinematic',
    thumbnail_url: '/presets/block-parry.jpg',
    master_prompt: 'A fighter parries incoming punch deflecting it aside, then counters with a strike, defensive martial arts',
    negative_prompt: 'blurry, low quality, distorted, deformed',
    lora_name: 'block_wan22.safetensors',
    lora_strength: 0.8,
    num_frames: 49,
    fps: 24,
    guidance_scale: 7.5,
    credits_cost: 40,
    uses_count: 0,
    rating: 4.4,
    is_public: true,
    is_featured: false,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: ['parry', 'counter', 'defense', 'block'],
  },
];

// Category metadata for UI
export const PRESET_CATEGORIES: Record<PresetCategory, { label: string; icon: string; color: string }> = {
  punch: { label: 'Punches', icon: '👊', color: 'red' },
  kick: { label: 'Kicks', icon: '🦶', color: 'orange' },
  takedown: { label: 'Takedowns', icon: '🤼', color: 'blue' },
  combo: { label: 'Combos', icon: '⚡', color: 'purple' },
  grapple: { label: 'Grappling', icon: '🔄', color: 'green' },
  weapon: { label: 'Weapons', icon: '⚔️', color: 'gray' },
  block: { label: 'Blocks', icon: '🛡️', color: 'cyan' },
  dodge: { label: 'Dodges', icon: '💨', color: 'yellow' },
};

// Style metadata for UI
export const PRESET_STYLES: Record<PresetStyle, { label: string; description: string }> = {
  cinematic: { label: 'Cinematic', description: 'Hollywood action movie style' },
  noir: { label: 'Film Noir', description: '1940s black and white crime drama' },
  cyberpunk: { label: 'Cyberpunk', description: 'Neon-lit futuristic streets' },
  anime: { label: 'Anime', description: 'Japanese animation style' },
  epic: { label: 'Epic', description: 'Grand scale heroic action' },
  vintage: { label: 'Vintage', description: '1970s grindhouse aesthetic' },
  neon: { label: 'Neon', description: 'Nightclub/rave lighting' },
  'golden-hour': { label: 'Golden Hour', description: 'Warm sunset lighting' },
  urban: { label: 'Urban Grit', description: 'Raw street fight aesthetic' },
};

// User data opt-in interface
export interface UserDataOptIn {
  user_id: string;
  opted_in: boolean;
  opted_in_at?: string;
  consent_text: string;
}

// Training data structure (what we collect when user opts in)
export interface TrainingDataEntry {
  id: string;
  user_id: string;
  preset_id: string;

  // Input
  character_image_url?: string;
  prompt: string;

  // Output
  output_video_url: string;

  // Metadata
  generation_params: {
    lora_name?: string;
    lora_strength: number;
    guidance_scale: number;
    num_frames: number;
    seed: number;
  };

  // Quality rating (user or admin rated)
  quality_rating?: number;  // 1-5
  is_approved: boolean;     // Admin approved for training

  created_at: string;
}
