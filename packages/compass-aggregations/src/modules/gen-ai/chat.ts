import type { OpenChatOptions } from '@mongodb-js/compass-components';
import { UUID } from 'bson';
import type { PipelineBuilderThunkAction } from '../';
import { getPipelineFromBuilderState } from '../pipeline-builder/builder-helpers';
import { toJSString } from 'mongodb-query-parser';

export const openAggregationInChat = ({
  instruction = 'Can you help with this pipeline?',
}: {
  instruction?: string;
}): PipelineBuilderThunkAction<void> => {
  return (
    dispatch,
    getState,
    { pipelineBuilder, connectionInfoRef, globalAppRegistry }
  ) => {
    const pipeline = getPipelineFromBuilderState(getState(), pipelineBuilder);

    const openChatMessage: OpenChatOptions = {
      id: new UUID().toString(),
      content: `${instruction}

${toJSString(pipeline)}`,
      role: 'user',
      // namespace,
      // TODO: Maybe some tab ids for other things.
      connectionId: connectionInfoRef?.current.id,
      // availableFollowUpActions: ['update-connection-info', 'action2'],

      // openInNewTab: true,
    };

    globalAppRegistry.emit('open-message-in-chat', openChatMessage);
  };
};
