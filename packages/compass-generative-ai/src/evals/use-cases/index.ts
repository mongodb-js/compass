import { findQueries } from './find-query';
import { aggregateQueries } from './aggregate-query';

export const genAiUsecases = [...findQueries, ...aggregateQueries];
