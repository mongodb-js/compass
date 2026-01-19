import React, { useCallback, useState } from 'react';
import {
  spacing,
  css,
  palette,
  InteractivePopover,
  Toggle,
  Body,
  Description,
  LeafyGreenProvider,
  Button,
  Link,
  useDarkMode,
  fontFamilies,
} from '@mongodb-js/compass-components';
import {
  usePreference,
  usePreferencesContext,
} from 'compass-preferences-model/provider';
import { useAssistantProjectId } from '../compass-assistant-provider';
import { AVAILABLE_TOOLS } from '@mongodb-js/compass-generative-ai';

const popoverContentStyles = css({
  padding: spacing[400],
  width: '320px',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[300],
});

const headerSectionStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const readOnlyToolsStyles = css({
  display: 'flex',
  width: '100%',
  justifyContent: 'space-between',
  gap: spacing[200],
});

const toolsContainerStyles = css({
  borderRadius: '12px',
  overflow: 'hidden',
  backgroundColor: palette.gray.dark3,
  border: `1px solid ${palette.gray.dark2}`,
});

const toolsHeaderStyles = css({
  padding: spacing[300],
  backgroundColor: palette.gray.dark2,
  borderBottom: `1px solid ${palette.gray.dark1}`,
});

const toolsHeaderTextStyles = css({
  fontFamily: fontFamilies.default,
  fontSize: '13px',
  fontWeight: 600,
  color: palette.gray.light3,
  margin: 0,
});

const toolsHeaderTextCountStyles = css({
  fontFamily: fontFamilies.default,
  fontWeight: 400,
  color: palette.gray.light1,
});

const toolListStyles = css({
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '325px',
  overflowY: 'auto',

  '&::-webkit-scrollbar': {
    width: '6px',
  },

  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },

  '&::-webkit-scrollbar-thumb': {
    backgroundColor: palette.white,
    borderRadius: '4px',
  },
});

const toolItemStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  padding: `${spacing[300]}px ${spacing[300]}px`,

  '&:not(:last-child)': {
    borderBottom: `1px solid ${palette.gray.dark2}`,
  },
});

const toolNameStyles = css({
  fontSize: '13px',
  fontWeight: 600,
  fontFamily: "'Source Code Pro', monospace",
  color: palette.gray.light3,
  margin: 0,
});

const toolDescriptionStyles = css({
  fontFamily: fontFamilies.default,
  fontSize: '12px',
  lineHeight: '18px',
  color: palette.gray.light1,
  fontWeight: 300,
});

export const ToolToggle: React.FunctionComponent = () => {
  const enableGenAIToolCallingAtlasProject = usePreference(
    'enableGenAIToolCallingAtlasProject'
  );
  const projectId = useAssistantProjectId();
  const learnMoreUrl = projectId
    ? 'https://www.mongodb.com/docs/atlas/atlas-ui/query-with-natural-language/data-explorer-ai-assistant/'
    : 'https://www.mongodb.com/docs/compass/query-with-natural-language/compass-ai-assistant/';
  const enableGenAIToolCalling = usePreference('enableGenAIToolCalling');

  const areToolCallsEnabled =
    !!enableGenAIToolCallingAtlasProject && enableGenAIToolCalling;
  const preferences = usePreferencesContext();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const darkMode = useDarkMode();
  // Popover should always be dark mode
  const popOverDarkMode = true;

  const handleToggle = useCallback(
    (checked: boolean) => {
      void preferences.savePreferences({
        enableGenAIToolCalling: checked,
      });
    },
    [preferences]
  );

  return (
    <LeafyGreenProvider darkMode={popOverDarkMode}>
      <InteractivePopover<HTMLButtonElement>
        open={popoverOpen}
        setOpen={setPopoverOpen}
        align="bottom"
        hideCloseButton={true}
        justify="end"
        containedElements={['#tool-toggle-popover-content']}
        trigger={({ onClick, ref, children }) => (
          <Button
            ref={ref}
            data-testid="tool-toggle-button"
            onClick={onClick}
            aria-label="Configure tool calling"
            aria-expanded={popoverOpen}
            darkMode={darkMode}
            size="small"
            leftGlyph={
              enableGenAIToolCalling ? <ActiveBoltIcon /> : <DisabledBoltIcon />
            }
          >
            Tools
            {children}
          </Button>
        )}
      >
        <LeafyGreenProvider darkMode={true}>
          <div
            id="tool-toggle-popover-content"
            className={popoverContentStyles}
          >
            <div className={headerSectionStyles}>
              <div className={readOnlyToolsStyles}>
                <Body weight="medium">Read-only tools</Body>
                <Toggle
                  id="enable-tool-calling-toggle"
                  aria-labelledby="enable-tool-calling-label"
                  size="small"
                  checked={areToolCallsEnabled}
                  onChange={handleToggle}
                  data-testid="tool-toggle-switch"
                  disabled={!enableGenAIToolCallingAtlasProject}
                />
              </div>
              <Description>
                {areToolCallsEnabled
                  ? 'These are currently enabled and require approval. You can use natural language to explore data and generate queries.'
                  : 'These are currently disabled. Enable them to use natural language to explore data and generate queries.'}
              </Description>
            </div>
            <Link href={learnMoreUrl} target="_blank">
              Learn more
            </Link>
            <div className={toolsContainerStyles}>
              <div className={toolsHeaderStyles}>
                <div className={toolsHeaderTextStyles}>
                  Available tools{' '}
                  <span className={toolsHeaderTextCountStyles}>
                    ({AVAILABLE_TOOLS.length})
                  </span>
                </div>
              </div>
              <div className={`${toolListStyles}`}>
                {AVAILABLE_TOOLS.map((tool) => (
                  <div key={tool.name} className={toolItemStyles}>
                    <div className={toolNameStyles}>{tool.name}</div>
                    <div className={toolDescriptionStyles}>
                      {tool.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </LeafyGreenProvider>
      </InteractivePopover>
    </LeafyGreenProvider>
  );
};

const iconStyles = css({
  width: '16px',
  height: '16px',
});

export const ActiveBoltIcon = () => {
  return (
    <svg
      fill="none"
      className={iconStyles}
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path
        d="M13.3656 7.84125L6.36562 15.3413C6.29144 15.4204 6.19353 15.4733 6.08665 15.4919C5.97977 15.5106 5.86974 15.4939 5.77314 15.4445C5.67655 15.3952 5.59864 15.3157 5.55117 15.2181C5.5037 15.1206 5.48925 15.0102 5.51 14.9038L6.42625 10.3206L2.82438 8.96813C2.74702 8.93919 2.67804 8.89154 2.62359 8.82944C2.56914 8.76734 2.53093 8.69272 2.51235 8.61225C2.49378 8.53177 2.49544 8.44795 2.51716 8.36827C2.53889 8.28859 2.58002 8.21553 2.63688 8.15563L9.63688 0.655625C9.71106 0.57646 9.80897 0.52357 9.91585 0.504936C10.0227 0.486302 10.1328 0.502935 10.2294 0.552326C10.326 0.601717 10.4039 0.681185 10.4513 0.778739C10.4988 0.876292 10.5132 0.986638 10.4925 1.09312L9.57375 5.68125L13.1756 7.03188C13.2524 7.061 13.3208 7.1086 13.3749 7.17045C13.4289 7.23231 13.4668 7.30652 13.4854 7.38652C13.5039 7.46653 13.5025 7.54987 13.4811 7.62918C13.4598 7.70849 13.4193 7.78132 13.3631 7.84125H13.3656Z"
        fill="#00A35C"
      ></path>
    </svg>
  );
};

export const DisabledBoltIcon = () => {
  return (
    <svg
      fill="none"
      className={iconStyles}
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path
        d="M3.555 1.99563C3.48914 1.92138 3.40919 1.86095 3.3198 1.81783C3.23041 1.77471 3.13335 1.74976 3.03424 1.74443C2.93514 1.7391 2.83596 1.75349 2.74246 1.78677C2.64896 1.82005 2.56299 1.87156 2.48954 1.93831C2.41609 2.00505 2.35662 2.08572 2.31458 2.17562C2.27253 2.26552 2.24875 2.36288 2.24461 2.46204C2.24046 2.5612 2.25604 2.6602 2.29044 2.75329C2.32484 2.84639 2.37738 2.93173 2.445 3.00437L4.74375 5.5325L2.45188 7.98812C2.36867 8.07723 2.30844 8.18528 2.2764 8.30292C2.24437 8.42055 2.24149 8.54422 2.26802 8.66321C2.29455 8.78221 2.34969 8.89294 2.42867 8.98582C2.50764 9.0787 2.60807 9.15093 2.72125 9.19625L5.92 10.4756L5.25812 14.8888C5.23383 15.0472 5.26095 15.2093 5.33552 15.3512C5.41009 15.4932 5.52817 15.6075 5.67245 15.6774C5.81673 15.7473 5.97961 15.7691 6.13721 15.7397C6.29481 15.7102 6.43882 15.631 6.54812 15.5138L10.2294 11.5694L12.445 14.0069C12.5795 14.1513 12.7655 14.237 12.9626 14.2452C13.1598 14.2534 13.3523 14.1836 13.4984 14.0509C13.6444 13.9182 13.7323 13.7332 13.7429 13.5361C13.7535 13.3391 13.686 13.1458 13.555 12.9981L3.555 1.99563ZM7.1 12.7219L7.49188 10.1113C7.51692 9.94416 7.48481 9.77351 7.40075 9.62695C7.3167 9.48039 7.18562 9.36651 7.02875 9.30375L4.29625 8.21062L5.75562 6.64813L9.21688 10.4556L7.1 12.7219ZM6.96313 4.25375C6.89073 4.18653 6.83234 4.10567 6.79128 4.01582C6.75023 3.92597 6.72733 3.82889 6.72391 3.73016C6.72048 3.63143 6.73659 3.533 6.77132 3.44052C6.80604 3.34804 6.85869 3.26333 6.92625 3.19125L9.45187 0.488125C9.56118 0.370841 9.70519 0.29167 9.86279 0.262224C10.0204 0.232779 10.1833 0.254609 10.3276 0.324512C10.4718 0.394416 10.5899 0.508713 10.6645 0.65064C10.739 0.792567 10.7662 0.954654 10.7419 1.11312L10.08 5.52437L13.2788 6.80375C13.3919 6.84907 13.4924 6.9213 13.5713 7.01418C13.6503 7.10706 13.7054 7.21779 13.732 7.33679C13.7585 7.45578 13.7556 7.57945 13.7236 7.69708C13.6916 7.81472 13.6313 7.92277 13.5481 8.01188L12.4969 9.13688C12.3611 9.28233 12.1731 9.3679 11.9743 9.37475C11.7754 9.38161 11.582 9.3092 11.4366 9.17344C11.2911 9.03768 11.2055 8.8497 11.1987 8.65085C11.1918 8.45201 11.2642 8.25858 11.4 8.11312L11.7038 7.7875L8.97125 6.69437C8.81438 6.63162 8.68331 6.51773 8.59925 6.37117C8.51519 6.22461 8.48308 6.05396 8.50813 5.88688L8.9 3.27625L8.025 4.21375C7.958 4.28626 7.87735 4.34483 7.78766 4.3861C7.69798 4.42738 7.60102 4.45053 7.50237 4.45425C7.40371 4.45797 7.30529 4.44217 7.21276 4.40776C7.12022 4.37335 7.03539 4.32102 6.96313 4.25375Z"
        fill="#C1C7C6"
      ></path>
    </svg>
  );
};
