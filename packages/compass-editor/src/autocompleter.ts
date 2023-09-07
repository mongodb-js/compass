import { getFilteredCompletions } from '@mongodb-js/mongodb-constants';

export { wrapField } from '@mongodb-js/mongodb-constants';

// TODO: add type exports from the package
export type CompletionResult = ReturnType<
  typeof getFilteredCompletions
>[number];
export type CompletionOptions = NonNullable<
  Parameters<typeof getFilteredCompletions>[0]
>;
export type Completions = NonNullable<
  Parameters<typeof getFilteredCompletions>[1]
>;

export function completer(
  prefix = '',
  options?: CompletionOptions,
  completions?: Completions
): CompletionResult[] {
  const res = getFilteredCompletions(options, completions);
  return res.filter(({ value }) => {
    return value.toLowerCase().startsWith(prefix.toLowerCase());
  });
}
