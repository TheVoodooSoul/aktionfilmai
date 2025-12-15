/**
 * Avatar @mention resolution utility
 * Allows users to reference trained avatars by name using @name syntax
 */

export interface AvatarReference {
  id: string;
  name: string;
  type?: 'custom' | 'default';
  image_url?: string;
  video_cover?: string;
}

/**
 * Extract all @mentions from a prompt
 * @param prompt - The input prompt text
 * @returns Array of mentioned names (without the @ symbol)
 */
export function extractMentions(prompt: string): string[] {
  if (!prompt) return [];

  // Match @word patterns (alphanumeric, underscores, hyphens)
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const matches = prompt.match(mentionRegex) || [];

  // Remove @ prefix and return unique names
  return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
}

/**
 * Find avatar by name (case-insensitive)
 * @param name - The avatar name to find
 * @param avatars - List of available avatars
 * @returns The matching avatar or undefined
 */
export function findAvatarByName(
  name: string,
  avatars: AvatarReference[]
): AvatarReference | undefined {
  const normalizedName = name.toLowerCase().trim();

  return avatars.find(avatar => {
    const avatarName = avatar.name?.toLowerCase().trim();
    return avatarName === normalizedName;
  });
}

/**
 * Resolve @mentions in a prompt to avatar IDs
 * @param prompt - The input prompt with @mentions
 * @param avatars - List of available avatars
 * @returns Object with resolved avatars and any unresolved mentions
 */
export function resolveMentions(
  prompt: string,
  avatars: AvatarReference[]
): {
  resolvedAvatars: AvatarReference[];
  unresolvedMentions: string[];
  firstAvatar: AvatarReference | null;
} {
  const mentions = extractMentions(prompt);
  const resolvedAvatars: AvatarReference[] = [];
  const unresolvedMentions: string[] = [];

  for (const mention of mentions) {
    const avatar = findAvatarByName(mention, avatars);
    if (avatar) {
      resolvedAvatars.push(avatar);
    } else {
      unresolvedMentions.push(mention);
    }
  }

  return {
    resolvedAvatars,
    unresolvedMentions,
    firstAvatar: resolvedAvatars[0] || null,
  };
}

/**
 * Process prompt - replace @mentions with avatar names for display
 * but return the avatar ID for API calls
 * @param prompt - The input prompt
 * @param avatars - List of available avatars
 * @returns Processed prompt info
 */
export function processAvatarPrompt(
  prompt: string,
  avatars: AvatarReference[]
): {
  displayPrompt: string;
  avatarId: string | null;
  avatarName: string | null;
  hasUnresolvedMentions: boolean;
  unresolvedMentions: string[];
} {
  const { resolvedAvatars, unresolvedMentions, firstAvatar } = resolveMentions(prompt, avatars);

  // For display, keep the prompt as-is (users see @ian)
  // For API, we extract the avatar ID

  return {
    displayPrompt: prompt,
    avatarId: firstAvatar?.id || null,
    avatarName: firstAvatar?.name || null,
    hasUnresolvedMentions: unresolvedMentions.length > 0,
    unresolvedMentions,
  };
}

/**
 * Get autocomplete suggestions for avatar mentions
 * @param partialName - The partial name typed after @
 * @param avatars - List of available avatars
 * @param limit - Maximum number of suggestions
 * @returns Array of matching avatars
 */
export function getAvatarSuggestions(
  partialName: string,
  avatars: AvatarReference[],
  limit: number = 5
): AvatarReference[] {
  const normalizedPartial = partialName.toLowerCase().trim();

  if (!normalizedPartial) {
    return avatars.slice(0, limit);
  }

  return avatars
    .filter(avatar => {
      const name = avatar.name?.toLowerCase() || '';
      return name.startsWith(normalizedPartial) || name.includes(normalizedPartial);
    })
    .slice(0, limit);
}
