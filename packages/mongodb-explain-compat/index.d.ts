declare function convertExplain<T>(input: T): T;
export = convertExplain;

export function getStageCursorKey(stage: any): string | undefined;
export function isAggregationExplain(input: any): boolean;
export function isShardedAggregationExplain(input: any): boolean;
export function isShardedFindExplain(input: any): boolean;
