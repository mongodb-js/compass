import createLogger from '@mongodb-js/compass-logging';
import globCb from 'glob';
import util from 'util';
import electron from 'electron';
import fs from 'fs';
import path from 'path';
import writeFileAtomic from 'write-file-atomic';

const { log, mongoLogId } = createLogger('USER-DATA');
const { mkdir, readFile, unlink } = fs.promises;
const glob = util.promisify(globCb);

interface ThrowingParseFunction<T> {
  (content: string): T;
}

interface AjvParseFunction<T> {
  (content: string): T | undefined;

  // NOTE: the optional message property is here to accomodate and avoid boilerplate
  // code with Ajv style parsing, where the parser don't throw in case of errors
  // and rather attach the last error as a property in the parse function itself.
  //
  // Using a function like JSON.parse, which instead throws will also work.
  message?: string;
  position?: number;
}

type ParseFunction<T> = ThrowingParseFunction<T> | AjvParseFunction<T>;

type SerializeFunction<T> = (object: T) => string;

/**
 * @example - Basic usage
 *
 * const userData = new UserData()
 *
 * await userData.write('user-preferences.json', {darkMode: true});
 * const userPreferences = await userData.read('user-preferences.json');
 * await userData.delete('user-preferences.json');
 *
 * @example - With collection
 *
 * await userData.readAll('connections/*.json');
 *
 * // or with setting a base subdir:
 *
 * const userData = new UserData({
 *   subDir: 'connections'
 * });
 *
 * await userData.readAll('*.json');
 *
 * @example - With custom serializer/parser
 *
 * const userData = new UserData<UserPreferences>({
 *   parse: (raw: string) => stringToUserPreferences(raw),
 *   serialize: (userPreferences: UserPreferences) => userPreferencesToString(userPreferences),
 * });
 *
 * @example - With json schema (ajv)
 *
 * const schema: JTDSchemaType<UserPreferences> = {
 *    properties: {
 *      darkMode: {type: 'boolean'}
 *    }
 * };
 *
 * const ajv = new Ajv();
 * const serialize = ajv.compileSerializer(schema);
 * const parse = ajv.compileParser(schema);
 *
 * const userData = new UserData<UserPreferences>({serialize, parse});
 *
 */
export class UserData<T = unknown> {
  private _basePath: string;
  private _parse: ThrowingParseFunction<T>;
  private _serialize: SerializeFunction<T>;

  constructor(
    options: {
      /**
       * Alternate base path instead of electronApp.getPath('userData')
       * useful for testing and non electron environments.
       *
       * Default to `electronApp.getPath('userData')`
       */
      alternateDataRoot?: string;

      /**
       * Subpath of the user data dir to use as base path for any operation.
       *
       * Default to `./`
       */
      subDir?: string;

      /**
       * An optional parse function which parses a string to an object of the
       * generic type `T`.
       */
      parse?: ParseFunction<T>;

      /**
       * An optional serialize function that converts an object of the
       * generic type `T` to a string.
       */
      serialize?: SerializeFunction<T>;
    } = {}
  ) {
    const electronApp = electron.remote?.app || electron.app;
    const userDataRoot = path.resolve(
      options.alternateDataRoot || electronApp.getPath('userData')
    );

    this._basePath = options.subDir
      ? this._resolve(userDataRoot, options.subDir)
      : userDataRoot;

    this._parse = this._conformParseFunctionToThrowOnError(
      options.parse ?? this._defaultParser
    );

    this._serialize = options.serialize ?? this._defaultSerializer;
  }

  /**
   * Reads and parse all the files in the configured subdir of user
   * data that matches the glob pattern `pattern`.
   *
   * NOTE: this method will log in case of errors and try to load as much files
   * as possible.
   *
   * @param {string} [pattern = "*.*"] - A glob pattern matching all the files to load.
   * @returns {Promise<T[]>} all the files read.
   */
  async readAll(pattern = '*.*'): Promise<T[]> {
    const pathAndContents = await this._readAllWithFileNames(pattern);

    const results = [];

    for (const { path, content } of pathAndContents) {
      try {
        results.push(JSON.parse(content.toString()));
      } catch (error) {
        log.error(
          mongoLogId(1_001_000_061),
          'UserData',
          'Error parsing file to json',
          {
            path: path,
          }
        );
      }
    }

    return results;
  }

  /**
   * Reads and parse the file specified by `filePath`.
   *
   * NOTE: this function will throw in case of error.
   *
   * @param {string} filePath - the file path to read.
   * @returns {Promise<T>} the parsed content.
   */
  async read(filePath: string): Promise<T> {
    const content = (await this._readFile(filePath)).toString();
    return this._parse(content);
  }

  async write(filePath: string, object: T): Promise<void> {
    const content = this._serialize(object);
    return await this._writeFile(filePath, content);
  }

  async delete(filePath: string): Promise<void> {
    const absolutePath = this._resolve(this._basePath, filePath);
    try {
      await unlink(absolutePath);
    } catch (error) {
      log.error(mongoLogId(1_001_000_001), 'UserData', 'Error deleting file', {
        path: absolutePath,
      });
    }
  }

  private _defaultParser(this: void, content: string): any {
    return JSON.parse(content);
  }

  private _defaultSerializer(this: void, content: unknown): string {
    return JSON.stringify(content, null, 2);
  }

  private _conformParseFunctionToThrowOnError<T>(
    parse: ParseFunction<T>
  ): ThrowingParseFunction<T> {
    return (content: string) => {
      const object = parse(content);
      if (object === undefined) {
        const ajvParse = parse as AjvParseFunction<T>;

        throw new Error(
          `${
            typeof ajvParse.message === 'string'
              ? ajvParse.message
              : 'unknown parse error'
          } at position: ${ajvParse.position ?? 'unknown'}`
        );
      }

      return object;
    };
  }

  private _resolve(root: string, filePath: string) {
    const pathRelativeToRoot = path.relative(root, filePath);
    const resolved = path.resolve(root, pathRelativeToRoot);

    if (
      pathRelativeToRoot.startsWith('..') ||
      path.isAbsolute(pathRelativeToRoot) ||
      root === resolved
    ) {
      throw new Error(
        `Invalid file path: '${filePath}' is not a subpath of ${root}.`
      );
    }

    return resolved;
  }

  private async _ensureParentDir(filePath: string) {
    await mkdir(path.dirname(filePath), { recursive: true });
  }

  private async _readFileAndIgnoreErrors(
    filePath: string
  ): Promise<Buffer | undefined> {
    try {
      return await readFile(filePath);
    } catch {
      log.error(mongoLogId(1_001_000_001), 'UserData', 'Error reading file', {
        path: filePath,
      });
      return undefined;
    }
  }

  private async _readFile(filePath: string): Promise<Buffer> {
    const absolutePath = this._resolve(this._basePath, filePath);
    return await readFile(absolutePath);
  }

  private async _readAllWithFileNames(
    pattern: string
  ): Promise<Array<{ path: string; content: Buffer }>> {
    const absolutePattern = this._resolve(this._basePath, pattern);

    const filePaths = await glob(absolutePattern);
    const filteredFiles = filePaths.filter((path) =>
      pattern ? new RegExp(pattern).exec(path) : true
    );

    const pathAndContents = await Promise.all(
      filteredFiles.map(async (path) => {
        return { path, content: await this._readFileAndIgnoreErrors(path) };
      })
    );

    const result = [];

    for (const { path, content } of pathAndContents) {
      if (typeof content !== 'undefined') {
        result.push({ path, content });
      }
    }

    return result;
  }

  private async _writeFile(filePath: string, content: string): Promise<void> {
    const absolutePath = this._resolve(this._basePath, filePath);
    await this._ensureParentDir(absolutePath);
    await writeFileAtomic(absolutePath, content);
  }
}
