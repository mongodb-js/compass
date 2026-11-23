import { useContext, useEffect, useMemo, useState } from 'react';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import { usePreference } from '@mongodb-js/compass-preferences-model/provider';
import { getAvailableTools } from '@mongodb-js/compass-generative-ai/provider';
import { AssistantActionsContext } from '../compass-assistant-provider';
import { TOOL_ID_PREFIX, toDisplayName } from '../skill-directives';

// Via's .d.ts re-exports are extensionless, which TypeScript can't follow under
// nodenext (see typings.d.ts), so its own SkillItem type resolves to any.
export type SkillItem = {
  id: string;
  label: string;
  description?: string;
  source?: string;
};

type SkillItemsState = {
  items: SkillItem[];
  isLoading: boolean;
};

export function useSkillItems(): SkillItemsState {
  const { fetchSkills } = useContext(AssistantActionsContext);
  const { log, mongoLogId } = useLogger('COMPASS-ASSISTANT-SKILLS');
  const [state, setState] = useState<SkillItemsState>({
    items: [],
    isLoading: true,
  });

  useEffect(() => {
    const controller = new AbortController();
    void fetchSkills?.({ signal: controller.signal })
      .then((skills) => {
        setState({
          items: skills.map(({ name, description, url }) => ({
            id: name,
            label: toDisplayName(name),
            description,
            source: url,
          })),
          isLoading: false,
        });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        log.warn(
          mongoLogId(1_001_000_460),
          'Assistant',
          'Failed to fetch skills',
          { error: (err as Error).message }
        );
        setState({ items: [], isLoading: false });
      });
    return () => controller.abort();
  }, [fetchSkills, log, mongoLogId]);

  return state;
}

export function useToolItems(): SkillItem[] {
  const isToolCallingEnabled = usePreference('enableToolCalling');
  const enableGenAIToolCalling = usePreference('enableGenAIToolCalling');
  const enableGenAIToolCallingAtlasProject = usePreference(
    'enableGenAIToolCallingAtlasProject'
  );
  const enableAtlasConnectionErrorDebuggerTool = usePreference(
    'enableAtlasConnectionErrorDebuggerTool'
  );
  const areToolCallsEnabled =
    isToolCallingEnabled &&
    !!enableGenAIToolCallingAtlasProject &&
    enableGenAIToolCalling;

  return useMemo(
    () =>
      areToolCallsEnabled
        ? getAvailableTools({ enableAtlasConnectionErrorDebuggerTool }).map(
            ({ name, description }) => ({
              id: `${TOOL_ID_PREFIX}${name}`,
              label: name,
              description,
            })
          )
        : [],
    [areToolCallsEnabled, enableAtlasConnectionErrorDebuggerTool]
  );
}
