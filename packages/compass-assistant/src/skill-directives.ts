const SKILL_DIRECTIVE_REGEX = /:skill\[([^\]]*)\](?:\{([^}]*)\})?/g;
const SKILL_ID_REGEX = /(?:^|\s)id=(\S+)/;
const SKILL_NAME_DISPLAY_PREFIX = 'mongodb-';
// Via only has skill tokens, so tools are told apart from skills by their id.
export const TOOL_ID_PREFIX = 'tool:';

// The composer serializes picked skills and tools as `:skill[label]{id=...}`
// directives. The label is shortened for display, so send the id (the full
// skill name) wrapped in a `<skill>` tag, or a `<tool>` tag for tools.
export function directivesToSkillTags(text: string): string {
  return text.replace(
    SKILL_DIRECTIVE_REGEX,
    (_match, label: string, attrs?: string) => {
      const id = attrs?.match(SKILL_ID_REGEX)?.[1] ?? label;
      return id.startsWith(TOOL_ID_PREFIX)
        ? `<tool>${id.slice(TOOL_ID_PREFIX.length)}</tool>`
        : `<skill>${id}</skill>`;
    }
  );
}

// What the user sees in the chat: the shortened `/label` instead of the tag.
export function directivesToDisplayText(text: string): string {
  return text.replace(SKILL_DIRECTIVE_REGEX, '/$1');
}

export function toDisplayName(skillName: string): string {
  return skillName.startsWith(SKILL_NAME_DISPLAY_PREFIX)
    ? skillName.slice(SKILL_NAME_DISPLAY_PREFIX.length)
    : skillName;
}
