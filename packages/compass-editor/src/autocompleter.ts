import type {
  CompletionFilterOptions,
  Completion,
} from '@mongodb-js/mongodb-constants';
import { getFilteredCompletions } from '@mongodb-js/mongodb-constants';

export { wrapField } from '@mongodb-js/mongodb-constants';

export type CompletionResult = Completion;
export type CompletionOptions = CompletionFilterOptions;

export function completer(
  prefix = '',
  options?: CompletionOptions,
  completions?: Completion[]
): CompletionResult[] {
  const res = getFilteredCompletions(options, completions);
  return res.filter(({ value }) => {
    return value.toLowerCase().startsWith(prefix.toLowerCase());
  });
}
