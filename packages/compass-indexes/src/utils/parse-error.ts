import { MongoError } from 'mongodb';
import type { AnyError } from 'mongodb';

export type IndexesError = AnyError | string;
/**
 * Data Service attaches string message property for some errors, but not all
 * that can happen during index creation/dropping.
 * Check for data service custom error, then node driver errmsg.
 */
export const parseError = (err: IndexesError): string => {
  if (typeof err === 'string') {
    return err;
  }
  if (typeof err?.message === 'string') {
    return err.message;
  }
  if (err instanceof MongoError && err.errmsg === 'string') {
    return err.errmsg;
  }
  return 'Unknown error';
};
