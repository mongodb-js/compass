/* eslint complexity: 0, camelcase: 0, no-nested-ternary: 0 */

import { signatures as shellSignatures, Topologies, TypeSignature } from '@mongosh/shell-api';
import semver from 'semver';
import {
  CONVERSION_OPERATORS,
  EXPRESSION_OPERATORS,
  STAGE_OPERATORS,
  QUERY_OPERATORS,
  ACCUMULATORS,
  BSON_TYPES,
  ATLAS,
  ADL,
  ON_PREM
} from 'mongodb-ace-autocompleter';

type TypeSignatureAttributes = { [key: string]: TypeSignature };

export interface AutocompleteParameters {
  topology: () => Topologies;
  connectionInfo: () => undefined | {
    is_atlas: boolean;
    is_data_lake: boolean;
    server_version: string;
  },
  getCollectionCompletionsForCurrentDb: (collName: string) => string[] | Promise<string[]>;
}

export const BASE_COMPLETIONS = EXPRESSION_OPERATORS.concat(
  CONVERSION_OPERATORS.concat(BSON_TYPES.concat(STAGE_OPERATORS)
  ));

export const MATCH_COMPLETIONS = QUERY_OPERATORS.concat(BSON_TYPES);

/**
 * The project stage operator.
 */
const PROJECT = '$project';

/**
 * The group stage operator.
 */
const GROUP = '$group';

/**
 * Return complete suggestions given currently typed line
 *
 * @param {AutocompleteParameters} params - Relevant information about the current connection.
 * @param {string} line - Current user input.
 *
 * @returns {array} Matching Completions, Current User Input.
 */
async function completer(params: AutocompleteParameters, line: string): Promise<[string[], string]> {
  const SHELL_COMPLETIONS = shellSignatures.ShellApi.attributes as TypeSignatureAttributes;
  const COLL_COMPLETIONS = shellSignatures.Collection.attributes as TypeSignatureAttributes;
  const DB_COMPLETIONS = shellSignatures.Database.attributes as TypeSignatureAttributes;
  const AGG_CURSOR_COMPLETIONS = shellSignatures.AggregationCursor.attributes as TypeSignatureAttributes;
  const COLL_CURSOR_COMPLETIONS = shellSignatures.Cursor.attributes as TypeSignatureAttributes;
  const RS_COMPLETIONS = shellSignatures.ReplicaSet.attributes as TypeSignatureAttributes;
  const CONFIG_COMPLETIONS = shellSignatures.ShellConfig.attributes as TypeSignatureAttributes;
  const SHARD_COMPLETE = shellSignatures.Shard.attributes as TypeSignatureAttributes;

  // keep initial line param intact to always return in return statement
  // check for contents of line with:
  const splitLine = line.split('.');
  const firstLineEl = splitLine[0];
  const elToComplete = splitLine[splitLine.length - 1];

  if (splitLine.length <= 1) {
    const hits = filterShellAPI(params, SHELL_COMPLETIONS, elToComplete);
    return [hits.length ? hits : [], line];
  } else if (firstLineEl.match(/\bdb\b/) && splitLine.length === 2) {
    // We're seeing something like 'db.foo' and expand that to all methods on
    // db which start with 'foo' and all collections on the current db that
    // start with 'foo'.
    const hits = filterShellAPI(params, DB_COMPLETIONS, elToComplete, splitLine);
    const colls = await params.getCollectionCompletionsForCurrentDb(elToComplete.trim());
    hits.push(...colls.map(coll => `${splitLine[0]}.${coll}`));
    return [hits.length ? hits : [], line];
  } else if (firstLineEl.match(/\bdb\b/) && splitLine.length > 2) {
    if (!splitLine[1].match(/^\s*\w+\s*$/) && !splitLine[1].match(/\bgetCollection\b/)) {
      // The collection name contains something that is not whitespace or an
      // alphanumeric character. This could be a function call, for example.
      // In any case, we can't currently provide reasonable autocompletion
      // suggestions for this.
      return [[], line];
    }

    if (splitLine.length > 3) {
      // We're seeing something like db.coll.find().xyz or db.coll.aggregate().xyz
      if (splitLine[2].match(/\baggregate\b/)) {
        // aggregation cursor completions
        const hits = filterShellAPI(
          params, AGG_CURSOR_COMPLETIONS, elToComplete, splitLine);
        return [hits.length ? hits : [], line];
      } else if (splitLine[2].match(/\bfind\b/)) {
        // collection cursor completions
        const hits = filterShellAPI(
          params, COLL_CURSOR_COMPLETIONS, elToComplete, splitLine);
        return [hits.length ? hits : [], line];
      }
      // This is something else, and we currently don't know what this is.
      return [[], line];
    }

    // complete aggregation and collection  queries/stages
    if (splitLine[2].includes('([') || splitLine[2].includes('({')) {
      let expressions;
      if (splitLine[2].match(/\baggregate\b/)) {
        // aggregation needs extra accumulators to autocomplete properly
        expressions = BASE_COMPLETIONS.concat(getStageAccumulators(
          params, elToComplete));
      } else {
        // collection querying just needs MATCH COMPLETIONS
        expressions = MATCH_COMPLETIONS;
      }
      // split on {, as a stage/query will always follow an open curly brace
      const splitQuery = line.split('{');
      const prefix = splitQuery.pop()?.trim();
      const command: string = prefix ? line.split(prefix).shift() as string : line;
      const hits = filterQueries(params, expressions, prefix || '', command);
      return [hits.length ? hits : [], line];
    }

    const hits = filterShellAPI(
      params, COLL_COMPLETIONS, elToComplete, splitLine);
    return [hits.length ? hits : [], line];
  } else if (firstLineEl.match(/\bsh\b/) && splitLine.length === 2) {
    const hits = filterShellAPI(
      params, SHARD_COMPLETE, elToComplete, splitLine);
    return [hits.length ? hits : [], line];
  } else if (firstLineEl.match(/\brs\b/) && splitLine.length === 2) {
    const hits = filterShellAPI(
      params, RS_COMPLETIONS, elToComplete, splitLine);
    return [hits.length ? hits : [], line];
  } else if (firstLineEl.match(/\bconfig\b/) && splitLine.length === 2) {
    const hits = filterShellAPI(
      params, CONFIG_COMPLETIONS, elToComplete, splitLine);
    return [hits.length ? hits : [], line];
  }

  return [[], line];
}

function isAcceptable(
  params: AutocompleteParameters,
  entry: { version?: string; projectVersion?: string; env?: string[]; },
  versionKey: 'version' | 'projectVersion') {
  const connectionInfo = params.connectionInfo();
  const isAcceptableVersion =
    !entry[versionKey] ||
    !connectionInfo ||
    semver.gte(connectionInfo.server_version, entry[versionKey] as string);
  const isAcceptableEnvironment =
    !entry.env ||
    !connectionInfo ||
    (connectionInfo.is_data_lake ? entry.env.includes(ADL) :
      connectionInfo.is_atlas ? entry.env.includes(ATLAS) :
        entry.env.includes(ON_PREM));
  return isAcceptableVersion && isAcceptableEnvironment;
}

// stage completions based on current stage string.
function getStageAccumulators(params: AutocompleteParameters, stage: string): typeof ACCUMULATORS {
  if (stage !== '') return [];

  if (stage.includes(PROJECT)) {
    return ACCUMULATORS.filter((acc: any) => {
      return isAcceptable(params, acc, 'projectVersion');
    });
  } else if (stage.includes(GROUP)) {
    return ACCUMULATORS;
  }
}

function filterQueries(params: AutocompleteParameters, completions: any, prefix: string, split: string): string[] {
  const hits: any[] = completions.filter((e: any) => {
    return e.name && e.name.startsWith(prefix) && isAcceptable(params, e, 'version');
  });

  return hits.map(h => `${split}${h.name}`);
}

function filterShellAPI(
  params: AutocompleteParameters,
  completions: { [key: string]: TypeSignature },
  prefix: string,
  split?: string[]): string[] {
  const hits: string[] = Object.keys(completions).filter((c: string) => {
    if (!c.startsWith(prefix)) return false;
    if (completions[c].deprecated) return false;

    const serverVersion = params.connectionInfo()?.server_version;
    if (!serverVersion) return true;

    const acceptableVersions = completions[c].serverVersions;
    const isAcceptableVersion =
      !acceptableVersions ||
      (semver.gte(serverVersion, acceptableVersions[0]) &&
       semver.lte(serverVersion, acceptableVersions[1]));

    const acceptableTopologies = completions[c].topologies;
    const isAcceptableTopology =
      !acceptableTopologies ||
      acceptableTopologies.includes(params.topology());

    return isAcceptableVersion && isAcceptableTopology;
  });

  if (split) {
    return hits.map(h => `${split.slice(0, -1).join('.')}.${h}`);
  }

  return hits;
}

export default completer;
