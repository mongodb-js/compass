/**
 * Utility-process implementations of the file-import APIs.
 *
 * TODO(COMPASS-10808): these are stubs that advertise the boundary. The real
 * logic still lives in `compass-import-export/src/import/*` and runs in the
 * renderer; moving it here is what lets that package drop `fs`, `stream-json`
 * and `papaparse`. Each stub below maps 1:1 onto an existing function:
 *
 *   guessFileType     -> import/guess-filetype.ts
 *   listCSVFields     -> import/list-csv-fields.ts
 *   analyzeCSVFields  -> import/analyze-csv-fields.ts
 *   importFromFile    -> import/import-csv.ts + import/import-json.ts
 *
 * The move is mostly mechanical: each currently takes an `input: Readable`
 * that the caller opened, and here it opens `filePath` itself. `importFromFile`
 * additionally owns the error-log file that the renderer writes today.
 */
import type { DataService } from '../data-service';
import type {
  GetImportFileInfoArgs,
  GetImportFileInfoResult,
  AnalyzeCSVFieldsArgs,
  AnalyzeCSVFieldsResult,
  GuessFileTypeArgs,
  GuessFileTypeResult,
  ImportFromFileArgs,
  ImportFromFileResult,
  ListCSVFieldsArgs,
  ListCSVFieldsResult,
} from './import-types';

function notImplemented(name: string): never {
  throw new Error(
    `${name} is not implemented yet: the import logic still runs in the renderer (COMPASS-10808)`
  );
}

export function getImportFileInfo(
  _args: GetImportFileInfoArgs
): Promise<GetImportFileInfoResult> {
  return notImplemented('getImportFileInfo');
}

export function guessFileType(
  _args: GuessFileTypeArgs
): Promise<GuessFileTypeResult> {
  return notImplemented('guessFileType');
}

export function listCSVFields(
  _args: ListCSVFieldsArgs
): Promise<ListCSVFieldsResult> {
  return notImplemented('listCSVFields');
}

export function analyzeCSVFields(
  _args: AnalyzeCSVFieldsArgs
): Promise<AnalyzeCSVFieldsResult> {
  return notImplemented('analyzeCSVFields');
}

export function importFromFile(
  _dataService: DataService,
  _args: ImportFromFileArgs
): Promise<ImportFromFileResult> {
  return notImplemented('importFromFile');
}
