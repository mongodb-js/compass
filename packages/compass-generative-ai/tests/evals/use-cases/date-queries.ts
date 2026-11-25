import type { GenAiUsecase } from '.';

const DAY_MS = 24 * 60 * 60 * 1000;

// Expected values are computed at run time because the prompt tells the model
// the current time; the model's answer is relative to it.
const iso = (date: Date) => `ISODate("${date.toISOString()}")`;
const daysAgo = (days: number) => iso(new Date(Date.now() - days * DAY_MS));
const startOfUtcDay = (daysBack = 0) => {
  const now = new Date();
  return iso(
    new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
        daysBack * DAY_MS
    )
  );
};
const startOfUtcMonth = () => {
  const now = new Date();
  return iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
};

const namespace = 'netflix.comments';

export const findDateQueries: GenAiUsecase[] = [
  {
    namespace,
    userInput: 'comments posted in the last 7 days',
    expectedOutput: `<filter>{date: {$gte: ${daysAgo(7)}}}</filter>`,
    name: 'date find: last 7 days',
  },
  {
    namespace,
    userInput: 'find the comments since last week',
    expectedOutput: `<filter>{date: {$gte: ${daysAgo(7)}}}</filter>`,
    name: 'date find: since last week',
  },
  {
    namespace,
    userInput: 'comments from the last 30 days, only name and date',
    expectedOutput: `
      <filter>{date: {$gte: ${daysAgo(30)}}}</filter>
      <project>{name: 1, date: 1}</project>
    `,
    name: 'date find: last 30 days with projection',
  },
  {
    namespace,
    userInput: 'comments posted yesterday',
    expectedOutput: `<filter>{date: {$gte: ${startOfUtcDay(
      1
    )}, $lt: ${startOfUtcDay()}}}</filter>`,
    name: 'date find: yesterday',
  },
  {
    namespace,
    userInput: 'comments posted this month',
    expectedOutput: `<filter>{date: {$gte: ${startOfUtcMonth()}}}</filter>`,
    name: 'date find: this month',
  },
  {
    namespace,
    userInput: 'comments posted in March 2008',
    expectedOutput: `<filter>{date: {$gte: ISODate("2008-03-01T00:00:00.000Z"), $lt: ISODate("2008-04-01T00:00:00.000Z")}}</filter>`,
    name: 'date find: fixed month',
  },
  {
    namespace,
    userInput: 'comments posted before the year 2000',
    expectedOutput: `<filter>{date: {$lt: ISODate("2000-01-01T00:00:00.000Z")}}</filter>`,
    name: 'date find: before fixed year',
  },
  {
    namespace,
    userInput: 'comentarios publicados en los últimos 30 días',
    expectedOutput: `<filter>{date: {$gte: ${daysAgo(30)}}}</filter>`,
    name: 'date find: last 30 days in Spanish',
  },
  {
    // Mentions recency but must not produce a date filter.
    namespace,
    userInput: 'show me the 5 most recent comments',
    expectedOutput: `
      <sort>{date: -1}</sort>
      <limit>5</limit>
    `,
    name: 'date find: most recent without date filter',
  },
];

export const aggregateDateQueries: GenAiUsecase[] = [
  {
    namespace,
    userInput:
      'how many comments were posted in the last 7 days? return it in a field called total',
    expectedOutput: `<aggregation>[
      {$match: {date: {$gte: ${daysAgo(7)}}}},
      {$count: "total"}
    ]</aggregation>`,
    name: 'date aggregate: count in last 7 days',
  },
  {
    namespace,
    userInput:
      'number of comments per day over the last 7 days, sorted by day ascending. use fields day and count',
    expectedOutput: `<aggregation>[
      {$match: {date: {$gte: ${daysAgo(7)}}}},
      {$group: {_id: {$dateToString: {format: "%Y-%m-%d", date: "$date"}}, count: {$sum: 1}}},
      {$sort: {_id: 1}},
      {$project: {_id: 0, day: "$_id", count: 1}}
    ]</aggregation>`,
    name: 'date aggregate: per day in last 7 days',
  },
  {
    namespace,
    userInput:
      'number of comments per year, most active year first. use fields year and count',
    expectedOutput: `<aggregation>[
      {$group: {_id: {$year: "$date"}, count: {$sum: 1}}},
      {$sort: {count: -1}},
      {$project: {_id: 0, year: "$_id", count: 1}}
    ]</aggregation>`,
    name: 'date aggregate: per year without date filter',
  },
];
