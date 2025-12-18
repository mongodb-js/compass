import type { ToolSet } from 'ai';
import type { Logger } from '@mongodb-js/compass-logging';
import z from 'zod';

// TODO: add readonly-db
type ToolGroup = 'compass-ui';

type CompassContext = {
  query?: string;
  aggregation?: string;
};

// TODO: add connection info
type ToolsContext = CompassContext;

export class ToolsController {
  private logger: Logger;
  private toolGroups: Set<ToolGroup> = new Set();
  private context: ToolsContext = Object.create(null);

  constructor({ logger }: { logger: Logger }) {
    this.logger = logger;
  }

  setActiveTools(toolGroups: Set<ToolGroup>): void {
    this.toolGroups = toolGroups;
  }

  getActiveTools(): ToolSet {
    const tools = Object.create(null);

    if (this.toolGroups.has('compass-ui')) {
      tools['get-compass-context'] = {
        description: 'Get the current Compass query or aggregation.',
        inputSchema: z.object({}),
        needsApproval: true,
        strict: false,
        execute: (): Promise<CompassContext> => {
          this.logger.log.info(
            this.logger.mongoLogId(1_001_000_386),
            'ToolsController',
            'Executing get-compass-context tool'
          );
          return Promise.resolve(this.context);
        },
        // TODO: toModelOutput function to format this?
      };
    }

    return tools;
  }

  setContext(context: ToolsContext): void {
    // TODO: we'll also disconnect if the active connection is not the intended
    // one and start connecting if necessary
    this.context = context;
  }

  getToolDescription(name: string): string | undefined {
    return this.getActiveTools()[name]?.description;
  }
}
