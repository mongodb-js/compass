import { useEffect, useState } from 'react';
import { parse, ParseMode } from '@mongodb-js/shell-bson-parser';

export type ParsedShellValue = {
  value: unknown;
  error: Error | undefined;
  pending: boolean;
};

type Settled = { source: string; value?: unknown; error?: Error };

async function parseObject(
  source: string
): Promise<{ value: unknown } | { error: Error }> {
  try {
    const value = await parse(source, {
      mode: ParseMode.Strict,
      allowComments: true,
      allowMethods: true,
    });
    if (!value || typeof value !== 'object') {
      throw new Error('Source expression is invalid');
    }
    return { value };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Parses shell syntax source asynchronously. Only for values derived from
 * local component state when parsing user input; anything derived from the
 * result should be computed in the consuming component.
 */
export function useParsedShellValue(source: string): ParsedShellValue {
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    let cancelled = false;
    void parseObject(source).then((result) => {
      if (!cancelled) {
        setSettled({ source, ...result });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [source]);

  // The previous result is kept while pending to avoid flicker. Comparing
  // sources keeps `pending` accurate on the render where source changes,
  // before the effect has run.
  return {
    value: settled?.value,
    error: settled?.error,
    pending: settled?.source !== source,
  };
}
