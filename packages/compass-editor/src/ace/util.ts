import type { CompletionWithServerInfo } from '../types';

export function getNames(completions: CompletionWithServerInfo[]): string[] {
  return completions
    .filter(
      (
        completion
      ): completion is CompletionWithServerInfo & { name: string } => {
        return !!completion.name;
      }
    )
    .map((completion) => completion.name);
}
