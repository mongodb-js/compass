import React, { useCallback, useMemo, useRef } from 'react';
import {
  ComposerCommandItem,
  ComposerCommandMenu,
  InputBar,
  InputComposer,
} from '@via-ds/components/input-composer';
import { ViaProvider } from '@via-ds/components/provider';
import { ThinkingBlock } from '@via-ds/components/thinking-block';
import { Text } from '@via-ds/components/typography';
import '@via-ds/components/index.css';
import { css, spacing, useDarkMode } from '@mongodb-js/compass-components';
import {
  directivesToDisplayText,
  directivesToSkillTags,
} from '../skill-directives';
import {
  useSkillItems,
  useToolItems,
  type SkillItem,
} from './use-command-items';
import { inputBarStyles, rowStyle, useMenuSizing } from './skills-menu-layout';

function matchesQuery(textValue: string, query: string) {
  return textValue.toLowerCase().includes(query.toLowerCase());
}

// ComposerCommandMenu only takes a flat command list, with no section support,
// and looks picked commands up by id. So section titles and empty placeholders
// are disabled pseudo-commands in that list; they can never be picked or
// inserted as tokens.
const SKILLS_SECTION_ID = '__section:skills';
const TOOLS_SECTION_ID = '__section:tools';
const NO_SKILLS_ID = '__empty:skills';
const NO_TOOLS_ID = '__empty:tools';
const NON_SELECTABLE_IDS = new Set([
  SKILLS_SECTION_ID,
  TOOLS_SECTION_ID,
  NO_SKILLS_ID,
  NO_TOOLS_ID,
]);

const pseudoCommand = (id: string): SkillItem => ({ id, label: id });

// Matches the padding the legacy LeafyGreen InputBar has in the chat grid
const outerStyles = css({
  inlineSize: '100%',
  boxSizing: 'border-box',
  padding: `${spacing[200]}px ${spacing[400]}px`,
});

const fullWidthStyles = css({ inlineSize: '100%' });

const rowTextStyles = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const sectionTitleStyles = css({
  '&&': {
    fontWeight: 600,
    color: 'var(--via-color-text-secondary)',
  },
});

const SECTION_TITLES = new Map([
  [SKILLS_SECTION_ID, 'Skills'],
  [TOOLS_SECTION_ID, 'Tools'],
]);

function getPlaceholderText(id: string, isLoading: boolean) {
  if (id === NO_TOOLS_ID) {
    return 'No tools available';
  }
  return isLoading ? 'Loading skills…' : 'No skills found';
}

type SkillsInputProps = {
  isStreaming: boolean;
  onSend: (text: string, displayText: string) => Promise<void> | void;
  onStop: () => void;
  children?: React.ReactNode;
};

// TODO(EAI-2610): Skills implementation will be replaced by the assistant frontend SDK (along with other compass components)
export const SkillsInput: React.FunctionComponent<SkillsInputProps> = ({
  isStreaming,
  onSend,
  onStop,
  children,
}) => {
  const darkMode = useDarkMode();
  const { items, isLoading } = useSkillItems();
  const tools = useToolItems();
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useMenuSizing(containerRef);

  const commands = useMemo(
    () => [
      pseudoCommand(SKILLS_SECTION_ID),
      ...items,
      pseudoCommand(NO_SKILLS_ID),
      pseudoCommand(TOOLS_SECTION_ID),
      ...tools,
      pseudoCommand(NO_TOOLS_ID),
    ],
    [items, tools]
  );

  const filter = useCallback(
    (textValue: string, query: string) => {
      if (textValue === NO_SKILLS_ID) {
        return !items.some((item) => matchesQuery(item.label, query));
      }
      if (textValue === NO_TOOLS_ID) {
        return !tools.some((tool) => matchesQuery(tool.label, query));
      }
      if (NON_SELECTABLE_IDS.has(textValue)) {
        return true;
      }
      return matchesQuery(textValue, query);
    },
    [items, tools]
  );

  const renderCommand = useCallback(
    (command: SkillItem) => {
      if (NON_SELECTABLE_IDS.has(command.id)) {
        const title = SECTION_TITLES.get(command.id);
        return (
          <ComposerCommandItem
            id={command.id}
            textValue={command.label}
            isDisabled
          >
            <Text
              ref={command.id === SKILLS_SECTION_ID ? menuRef : undefined}
              className={title ? sectionTitleStyles : rowTextStyles}
              style={rowStyle}
            >
              {title ?? getPlaceholderText(command.id, isLoading)}
            </Text>
          </ComposerCommandItem>
        );
      }
      return (
        <ComposerCommandItem id={command.id} textValue={command.label}>
          <Text
            className={rowTextStyles}
            style={rowStyle}
          >{`/${command.label}`}</Text>
          {command.description && (
            <Text slot="description" className={rowTextStyles} style={rowStyle}>
              {command.description}
            </Text>
          )}
        </ComposerCommandItem>
      );
    },
    [isLoading, menuRef]
  );

  const handleSubmit = useCallback(
    (e: { text: string }) => {
      void onSend(
        directivesToSkillTags(e.text),
        directivesToDisplayText(e.text)
      );
    },
    [onSend]
  );

  const actionSlot = useMemo(
    () => (children ? <div slot="action">{children}</div> : null),
    [children]
  );

  return (
    <div className={outerStyles}>
      <ViaProvider colorScheme={darkMode ? 'dark' : 'light'}>
        <div
          ref={containerRef}
          data-testid="assistant-chat-input"
          className={fullWidthStyles}
        >
          <InputComposer
            onSubmit={handleSubmit}
            isStreaming={isStreaming}
            onStop={onStop}
            className={fullWidthStyles}
            sendLabel="Send message"
            stopLabel="Stop message"
          >
            <InputBar
              className={inputBarStyles}
              aria-label="Ask a question"
              placeholder="Ask a question"
            />
            {actionSlot}
            <ComposerCommandMenu
              trigger="/"
              aria-label="Skills and tools"
              commands={commands}
              filter={filter}
            >
              {renderCommand}
            </ComposerCommandMenu>
          </InputComposer>
        </div>
      </ViaProvider>
    </div>
  );
};

export const ThinkingIndicator: React.FunctionComponent = () => {
  const darkMode = useDarkMode();
  return (
    <ViaProvider colorScheme={darkMode ? 'dark' : 'light'}>
      <ThinkingBlock status="in_progress" />
    </ViaProvider>
  );
};
