import type { Ace } from 'ace-builds';
export * from './editor';
export { ValidationAutoCompleter } from './ace/validation-autocompleter';
export { QueryAutoCompleter } from './ace/query-autocompleter';
export { StageAutoCompleter } from './ace/stage-autocompleter';
export { AggregationAutoCompleter } from './ace/aggregation-autocompleter';
export type AceEditor = Ace.Editor;
export type { CompletionWithServerInfo } from './types';
