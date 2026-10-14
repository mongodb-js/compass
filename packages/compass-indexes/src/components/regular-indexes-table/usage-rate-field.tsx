import React from 'react';
import { Tooltip, Body } from '@mongodb-js/compass-components';
import { formatUsageSince } from '../../utils/format-usage-since';

const NO_USAGE_RATE =
  'Either the server does not support the $indexStats command,' +
  ' the user is not authorized to execute it, or the server has not' +
  ' reported when it started tracking usage for this index.';

const MS_PER_MINUTE = 60 * 1000;

/**
 * Average index hits per minute, derived from the $indexStats `accesses.ops`
 * and `accesses.since` pair that the data service exposes as usageCount and
 * usageSince.
 *
 * `accesses.since` is reset by a server restart as well as by index creation,
 * so the period is "since whichever happened last" rather than the lifetime of
 * the index: https://www.mongodb.com/docs/manual/reference/operator/aggregation/indexStats/
 *
 * Legacy Data Explorer / Cloud Manager showed the same rate, but had the server
 * precompute the period as `accessPeriod`.
 */
export const getUsageRatePerMinute = (
  usage: number | undefined,
  since: Date | undefined,
  now: number = Date.now()
): number | null => {
  // A count with no period is not a rate. Returning 0 here would render as
  // "0/min", reporting an index with unknown usage as one that is never used.
  if (usage === null || usage === undefined || !since) {
    return null;
  }

  // since is a server timestamp compared against a client clock, so it can be
  // at or ahead of now. Avoids dividing by zero or reporting a negative rate.
  const periodMs = now - since.getTime();
  if (periodMs <= 0) {
    return null;
  }

  return (usage / periodMs) * MS_PER_MINUTE;
};

/**
 * Sortable rate for an index, treating an underivable rate as never-used so
 * that those rows group with the unused ones instead of sorting arbitrarily.
 */
export const getUsageRateSortValue = (
  usage: number | undefined,
  since: Date | undefined
): number => {
  return getUsageRatePerMinute(usage, since) ?? 0;
};

// Rounding a rate below one hit per minute either reads as 0, which is
// indistinguishable from an index that was never used, or rounds up to 1 and
// overstates usage. Shared by the cell and the tooltip so that the two can't
// describe the same rate differently.
const isBelowOnePerMinute = (rate: number) => rate > 0 && rate < 1;

const roundRate = (rate: number) => Math.round(rate);

export const formatUsageRate = (rate: number | null): string => {
  if (rate === null) {
    return 'Rate unavailable';
  }
  return isBelowOnePerMinute(rate) ? '< 1/min' : `${roundRate(rate)}/min`;
};

export const getUsageRateTooltip = (
  rate: number | null,
  since?: Date
): string => {
  // A derivable rate always comes with the period it was derived from.
  if (rate === null || !since) {
    return NO_USAGE_RATE;
  }
  if (rate === 0) {
    return `This index has not been used since ${since.toISOString()}`;
  }
  if (isBelowOnePerMinute(rate)) {
    return `Less than 1 index hit per minute on average since ${since.toISOString()}`;
  }
  return `${roundRate(
    rate
  )} index hits per minute on average since ${since.toISOString()}`;
};

type UsageRateFieldProps = {
  usage?: number;
  since?: Date;
};

const nbsp = '\u00a0';

/**
 * The rate and the period it covers are built as a single string so that the
 * cell is one text node, which keeps it matchable by text in tests.
 */
export const formatUsageRateWithPeriod = (
  rate: number | null,
  since?: Date
): string => {
  const formatted = formatUsageRate(rate);
  if (rate === null || !since) {
    return formatted;
  }
  return `${formatted}${nbsp}(since ${formatUsageSince(since)})`;
};

const UsageRateField: React.FunctionComponent<UsageRateFieldProps> = ({
  usage,
  since,
}) => {
  const rate = getUsageRatePerMinute(usage, since);

  return (
    <Tooltip trigger={<Body>{formatUsageRateWithPeriod(rate, since)}</Body>}>
      <Body>{getUsageRateTooltip(rate, since)}</Body>
    </Tooltip>
  );
};

export default UsageRateField;
