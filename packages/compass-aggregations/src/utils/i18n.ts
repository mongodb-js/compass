import { translate } from '@mongodb-js/compass-components';
import type { TranslateFn } from '@mongodb-js/compass-components';
import type { PreferencesAccess } from 'compass-preferences-model/provider';

export const translateEnglish: TranslateFn = (key, english, vars) =>
  translate('en', key, english, vars);

export const getTranslator = (preferences: PreferencesAccess): TranslateFn => {
  return (key, english, vars) =>
    translate(
      preferences?.getPreferences().language ?? 'en',
      key,
      english,
      vars
    );
};

const PARSER_MESSAGES: Record<string, [key: string, english: string]> = {
  'Each element of the pipeline array must be an object': [
    'aggregations.parser.elementNotObject',
    'Each element of the pipeline array must be an object',
  ],
  'A pipeline stage specification object must contain exactly one field.': [
    'aggregations.parser.exactlyOneField',
    'A pipeline stage specification object must contain exactly one field.',
  ],
  'Stage value can not be empty': [
    'aggregations.stageEditor.valueEmpty',
    'Stage value can not be empty',
  ],
  'Stage value is invalid': [
    'aggregations.parser.stageValueInvalid',
    'Stage value is invalid',
  ],
  'Pipeline must be an array of aggregation stages': [
    'aggregations.parser.mustBeArray',
    'Pipeline must be an array of aggregation stages',
  ],
  'Invalid pipeline': [
    'aggregations.parser.invalidPipeline',
    'Invalid pipeline',
  ],
  'Source expression is invalid': [
    'aggregations.parser.invalidSource',
    'Source expression is invalid',
  ],
  'Cannot convert empty wizard to stage': [
    'aggregations.parser.emptyWizard',
    'Cannot convert empty wizard to stage',
  ],
};

const UNRECOGNIZED_STAGE_PREFIX = 'Unrecognized pipeline stage name';

/**
 * Translates the static parts of pipeline parser errors. Raw messages coming
 * from the underlying JavaScript parser are returned unchanged.
 */
export function translateParserMessage(
  t: TranslateFn,
  message: string
): string {
  const known = PARSER_MESSAGES[message];
  if (known) {
    return t(known[0], known[1]);
  }
  if (message.startsWith(UNRECOGNIZED_STAGE_PREFIX)) {
    const rest = message.slice(UNRECOGNIZED_STAGE_PREFIX.length);
    const name = /^: '(.*)'$/.exec(rest)?.[1];
    return name === undefined
      ? t(
          'aggregations.parser.unrecognizedStage',
          'Unrecognized pipeline stage name'
        )
      : t(
          'aggregations.parser.unrecognizedStageNamed',
          "Unrecognized pipeline stage name: '{name}'",
          { name }
        );
  }
  return message;
}
