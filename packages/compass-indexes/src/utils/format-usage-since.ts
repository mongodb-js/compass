// Matches the date format the Data Explorer index table uses, so the two
// surfaces read the same. The full ISO timestamp is 24 characters and wraps
// the Usage and Avg. rate of usage cells onto a second line; the tooltips
// carry it instead.
export const formatUsageSince = (since: Date): string => {
  return since.toDateString();
};
