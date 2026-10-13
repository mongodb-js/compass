import React from 'react';
import { Tooltip, Body } from '@mongodb-js/compass-components';

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

export const formatUsageRate = (rate: number | null): string => {
  if (rate === null) {
    return 'Rate unavailable';
  }
  if (rate === 0) {
    return '0/min';
  }
  // Below one hit per minute the rounded value reads as 0/min, which is
  // indistinguishable from an index that was never used.
  if (rate < 1) {
    return '< 1/min';
  }
  return `${parseFloat(rate.toFixed(2))}/min`;
};

export const getUsageRateTooltip = (
  rate: number | null,
  since?: Date
): string => {
  if (rate === null) {
    return NO_USAGE_RATE;
  }
  if (rate === 0) {
    return since
      ? `This index has not been used since ${since.toDateString()}`
      : 'This index has not been used';
  }
  return `${parseFloat(
    rate.toFixed(2)
  )} index hits per minute on average since ${(since as Date).toDateString()}`;
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
  return `${formatted}${nbsp}(since ${since.toDateString()})`;
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
