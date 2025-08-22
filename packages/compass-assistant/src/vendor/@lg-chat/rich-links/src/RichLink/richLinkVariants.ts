import { RichLinkBadgeControlProps } from './RichLink.types';

export const richLinkVariants = {
  Article: {
    badgeColor: 'green',
    badgeLabel: 'Article',
    badgeGlyph: 'Note',
  },
  Blog: {
    badgeColor: 'green',
    badgeLabel: 'Blog',
    badgeGlyph: 'SMS',
  },
  Book: {
    badgeColor: 'yellow',
    badgeLabel: 'Book',
    badgeGlyph: 'University',
  },
  Code: {
    badgeColor: 'gray',
    badgeLabel: 'Code',
    badgeGlyph: 'CodeBlock',
  },
  Docs: {
    badgeColor: 'blue',
    badgeLabel: 'Docs',
    badgeGlyph: 'Note',
  },
  Learn: {
    badgeColor: 'red',
    badgeLabel: 'Learn',
    badgeGlyph: 'Cap',
  },
  Video: {
    badgeColor: 'red',
    badgeLabel: 'Video',
    badgeGlyph: 'Play',
  },
  Website: {
    badgeColor: 'purple',
    badgeLabel: 'Website',
    badgeGlyph: 'Laptop',
  },
} as const satisfies Record<string, RichLinkBadgeControlProps>;

export type RichLinkVariantName = keyof typeof richLinkVariants;

const richLinkVariantNames = Object.keys(richLinkVariants);

export function isRichLinkVariantName(str: string): str is RichLinkVariantName {
  return richLinkVariantNames.includes(str);
}
