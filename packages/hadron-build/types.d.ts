declare module 'mongodb-js-cli' {
  class CLI {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    argv: any;
    debug(msg: string, ...args: unknown[]): void;
    info(msg: string): void;
    ok(msg: string): void;
    warn(msg: string): void;
    error(title: string, err?: Error): void;
    abortIfError(err: Error | null | undefined): void;
    abort(err: Error): void;
  }
  function createCLI(name: string): CLI;
  export = createCLI;
}

declare module 'cli-table' {
  interface TableOptions {
    head?: string[];
    [key: string]: unknown;
  }
  class Table {
    constructor(options?: TableOptions);
    push(row: unknown[]): void;
    toString(): string;
  }
  export = Table;
}

declare module 'flatnest' {
  export function flatten(
    obj: Record<string, unknown>
  ): Record<string, unknown>;
  export function nest(obj: Record<string, unknown>): Record<string, unknown>;
}

declare module 'download' {
  function download(
    url: string,
    destination?: string,
    options?: Record<string, unknown>
  ): Promise<Buffer> & NodeJS.ReadableStream;
  export = download;
}

declare module 'del' {
  function del(
    patterns: string | string[],
    options?: { force?: boolean }
  ): Promise<string[]>;
  export = del;
}

declare module 'zip-folder' {
  function zipFolder(
    folder: string,
    zipFile: string,
    callback: (err: Error | null) => void
  ): void;
  export = zipFolder;
}

declare module 'electron-packager-plugin-non-proprietary-codecs-ffmpeg' {
  const plugin: {
    default: (context: unknown, callback: () => void) => void;
  };
  export = plugin;
}

declare module 'parse-github-repo-url' {
  function parseGitHubRepoURL(url: string): [string, string];
  export = parseGitHubRepoURL;
}

declare module 'tar' {
  interface CreateOptions {
    file: string;
    cwd?: string;
    portable?: boolean;
    gzip?: boolean;
  }
  function create(options: CreateOptions, paths: string[]): Promise<void>;
  export { create };
}

declare module 'plist' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function parse(text: string): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function build(data: any): string;
}

declare module 'json-diff' {
  export function diffString(
    obj1: unknown,
    obj2: unknown,
    options?: Record<string, unknown>
  ): string;
  export function diff(
    obj1: unknown,
    obj2: unknown,
    options?: Record<string, unknown>
  ): unknown;
}
