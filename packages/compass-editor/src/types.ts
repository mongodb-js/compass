import type AceBuilds from 'ace-builds';
import type { Ace } from 'ace-builds';

type GlobalAce = {
  EditSession: typeof AceBuilds['EditSession'];
  Range: typeof AceBuilds['Range'];
  UndoManager: typeof AceBuilds['UndoManager'];
  VirtualRenderer: typeof AceBuilds['VirtualRenderer'];
  config: typeof AceBuilds['config'];
  createEditSession: typeof AceBuilds['createEditSession'];
  edit: typeof AceBuilds['edit'];
  require: typeof AceBuilds['require'];
  version: typeof AceBuilds['version'];
  acequire: typeof AceBuilds['require'];
  define: (
    module: string,
    depdendencies: string[],
    moduleFn: (
      acequire: typeof AceBuilds['require'],
      exports: any,
      module: any
    ) => void
  ) => void;
};

declare global {
  const ace: GlobalAce;
}

export interface HighlightRules {
  normalizeRules(): void;
  createKeywordMapper(
    map: Record<string, string>,
    defaultToken: string
  ): (...args: any[]) => any;
  $rules: Record<
    string,
    {
      regex: string | RegExp;
      token: string | string[] | ((...args: any[]) => any);
      next?: string;
    }[]
  >;
}

interface WorkerClient {
  attachToDocument(doc: Document): void;
}

export interface AceMode {
  HighlightRules: new (...args: any[]) => HighlightRules;
  createWorker(session: Ace.EditSession): WorkerClient | null;
}

export type CompletionWithServerInfo = Ace.Completion & {
  /** Server version that supports the stage */
  version: string;
  /* Server version that supports using the key in $project stage */
  projectVersion?: string;
};
