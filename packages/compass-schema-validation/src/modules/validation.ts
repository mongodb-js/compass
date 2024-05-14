import type { RootAction, RootState, SchemaValidationThunkAction } from '.';
import { EJSON } from 'bson';
import { parseFilter } from 'mongodb-query-parser';
import { stringify as javascriptStringify } from 'javascript-stringify';
import { clearSampleDocuments } from './sample-documents';
import { zeroStateChanged } from './zero-state';
import { isLoadedChanged } from './is-loaded';
import { isEqual, pick } from 'lodash';
import type { ThunkDispatch } from 'redux-thunk';
import mongodbSchema from 'mongodb-schema';
import type {
  SchemaField,
  ArraySchemaType,
  DocumentSchemaType,
  SchemaType,
  PrimitiveSchemaType,
} from 'mongodb-schema';

export type ValidationServerAction = 'error' | 'warn';
export type ValidationLevel = 'off' | 'moderate' | 'strict';

/**
 * The module action prefix.
 */
const PREFIX = 'validation' as const;

/**
 * Validator changed action name.
 */
export const VALIDATOR_CHANGED = `${PREFIX}/VALIDATOR_CHANGED` as const;
interface ValidatorChangedAction {
  type: typeof VALIDATOR_CHANGED;
  validator: string;
}

/**
 * Validation canceled action name.
 */
export const VALIDATION_CANCELED = `${PREFIX}/VALIDATION_CANCELED` as const;
interface ValidationCanceledAction {
  type: typeof VALIDATION_CANCELED;
  validation: Validation;
}

/**
 * Validation save failed action name.
 */
export const VALIDATION_SAVE_FAILED =
  `${PREFIX}/VALIDATION_SAVE_FAILED` as const;
interface ValidationSaveFailedAction {
  type: typeof VALIDATION_SAVE_FAILED;
  error: null | { message: string };
}

/**
 * Validation fetched action name.
 */
export const VALIDATION_FETCHED = `${PREFIX}/VALIDATION_FETCHED` as const;
interface ValidationFetchedAction {
  type: typeof VALIDATION_FETCHED;
  validation: PartialValidation;
}

/**
 * Validation action changed action name.
 */
export const VALIDATION_ACTION_CHANGED =
  `${PREFIX}/VALIDATION_ACTION_CHANGED` as const;
interface ValidationActionChangedAction {
  type: typeof VALIDATION_ACTION_CHANGED;
  validationAction: ValidationServerAction;
}

/**
 * Validation level changed action name.
 */
export const VALIDATION_LEVEL_CHANGED =
  `${PREFIX}/VALIDATION_LEVEL_CHANGED` as const;
interface ValidationLevelChangedAction {
  type: typeof VALIDATION_LEVEL_CHANGED;
  validationLevel: ValidationLevel;
}

/**
 * Syntax error occurred action name.
 */
export const SYNTAX_ERROR_OCCURRED = `${PREFIX}/SYNTAX_ERROR_OCCURRED` as const;
interface SyntaxErrorOccurredAction {
  type: typeof SYNTAX_ERROR_OCCURRED;
  syntaxError: null | { message: string };
}

export type ValidationAction =
  | ValidatorChangedAction
  | ValidationCanceledAction
  | ValidationSaveFailedAction
  | ValidationFetchedAction
  | ValidationActionChangedAction
  | ValidationLevelChangedAction
  | SyntaxErrorOccurredAction;

export interface Validation {
  validator: string;
  validationAction: ValidationServerAction;
  validationLevel: ValidationLevel;
  isChanged?: boolean;
  error?: null | { message: string };
}
type PartialValidation = Pick<
  Validation,
  'validationAction' | 'validationLevel'
> &
  Partial<Validation>;

export interface ValidationState extends Validation {
  isChanged: boolean;
  syntaxError: null | { message: string };
  error: null | { message: string };
  prevValidation?: Validation;
}

/**
 * The initial state.
 */
export const INITIAL_STATE: ValidationState = {
  validator: '',
  validationAction: 'error',
  validationLevel: 'strict',
  isChanged: false,
  syntaxError: null,
  error: null,
};

/**
 * Check validator as a simple query.
 */
export const checkValidator = (
  validator: string
): {
  syntaxError: null | { message: string };
  validator: Record<string, unknown> | string;
} => {
  const validation: {
    syntaxError: null | { message: string };
    validator: Record<string, unknown> | string;
  } = { syntaxError: null, validator };

  if (validator === '') {
    validation.syntaxError = {
      message: 'The validator must be an object.',
    };
  } else {
    try {
      validation.validator = parseFilter(validator);
    } catch (error) {
      validation.syntaxError = error as Error;
    }
  }

  return validation;
};

/**
 * Change validator.
 */
const changeValidator = (
  state: ValidationState,
  action: ValidatorChangedAction
): ValidationState => {
  const checkedValidator = checkValidator(action.validator);
  const newState = {
    ...state,
    validator: action.validator,
    syntaxError: checkedValidator.syntaxError,
    error: null,
  };

  return {
    ...newState,
    isChanged: !isEqual(
      pick(newState, ['validator', 'validationAction', 'validationLevel']),
      state.prevValidation
    ),
  };
};

/**
 * Sets syntax error.
 */
const setSyntaxError = (
  state: ValidationState,
  action: SyntaxErrorOccurredAction
): ValidationState => ({
  ...state,
  isChanged: true,
  syntaxError: action.syntaxError,
});

/**
 * Set validation.
 */
const setValidation = (
  state: ValidationState,
  action: ValidationFetchedAction | ValidationCanceledAction
): ValidationState => {
  const checkedValidator = checkValidator(action.validation.validator ?? '');
  // TODO(COMPASS-4989): javascriptStringify??
  const validator = javascriptStringify(
    checkedValidator.validator,
    null,
    2
  ) as string;

  return {
    ...state,
    prevValidation: {
      validator,
      validationAction: action.validation.validationAction,
      validationLevel: action.validation.validationLevel,
    },
    isChanged: action.validation.isChanged || false,
    validator: validator,
    validationAction: action.validation.validationAction,
    validationLevel: action.validation.validationLevel,
    syntaxError: null,
    error: action.validation.error || null,
  };
};

/**
 * Set Error.
 */
const setError = (
  state: ValidationState,
  action: ValidationSaveFailedAction
): ValidationState => {
  return {
    ...state,
    error: action.error || null,
  };
};

/**
 * Change validation action.
 */
const changeValidationAction = (
  state: ValidationState,
  action: ValidationActionChangedAction
): ValidationState => {
  const newState = {
    ...state,
    validationAction: action.validationAction,
  };

  return {
    ...newState,
    isChanged: !isEqual(
      pick(newState, ['validator', 'validationAction', 'validationLevel']),
      state.prevValidation
    ),
  };
};

/**
 * Change validation level.
 */
const changeValidationLevel = (
  state: ValidationState,
  action: ValidationLevelChangedAction
): ValidationState => {
  const newState = {
    ...state,
    validationLevel: action.validationLevel,
  };

  return {
    ...newState,
    isChanged: !isEqual(
      pick(newState, ['validator', 'validationAction', 'validationLevel']),
      state.prevValidation
    ),
  };
};

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS: {
  [Type in ValidationAction['type']]: (
    state: ValidationState,
    action: ValidationAction & { type: Type }
  ) => ValidationState;
} = {
  [VALIDATOR_CHANGED]: changeValidator,
  [VALIDATION_CANCELED]: setValidation,
  [VALIDATION_FETCHED]: setValidation,
  [VALIDATION_SAVE_FAILED]: setError,
  [VALIDATION_ACTION_CHANGED]: changeValidationAction,
  [VALIDATION_LEVEL_CHANGED]: changeValidationLevel,
  [SYNTAX_ERROR_OCCURRED]: setSyntaxError,
};

/**
 * Reducer function for handle state changes to status.
 */
export default function reducer(
  state: ValidationState = INITIAL_STATE,
  action: RootAction
): ValidationState {
  const fn = MAPPINGS[action.type as ValidationAction['type']];

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore-error TS does not understand that action can be passed to fn
  return fn ? fn(state, action) : state;
}

/**
 * Action creator for validation action changed events.
 */
export const validationActionChanged = (
  validationAction: ValidationServerAction
): ValidationActionChangedAction => ({
  type: VALIDATION_ACTION_CHANGED,
  validationAction,
});

/**
 * Action creator for validation level changed events.
 */
export const validationLevelChanged = (
  validationLevel: ValidationLevel
): ValidationLevelChangedAction => ({
  type: VALIDATION_LEVEL_CHANGED,
  validationLevel,
});

/**
 * Action creator for validator changed events.
 */
export const validatorChanged = (
  validator: string
): ValidatorChangedAction => ({
  type: VALIDATOR_CHANGED,
  validator,
});

/**
 * Action creator for validation fetched events.
 */
export const validationFetched = (
  validation: PartialValidation
): ValidationFetchedAction => ({
  type: VALIDATION_FETCHED,
  validation,
});

/**
 * Action creator for validation canceled events.
 */
export const validationCanceled = (
  validation: Validation
): ValidationCanceledAction => ({
  type: VALIDATION_CANCELED,
  validation,
});

/**
 * Action creator for validation save failed events.
 *
 * @param {Object} error - Error.
 *
 * @returns {Object} Validation save failed action.
 */
export const validationSaveFailed = (error: {
  message: string;
}): ValidationSaveFailedAction => ({
  type: VALIDATION_SAVE_FAILED,
  error,
});

/**
 * Action creator for syntax error occurred events.
 */
export const syntaxErrorOccurred = (
  syntaxError: null | { message: string }
): SyntaxErrorOccurredAction => ({
  type: SYNTAX_ERROR_OCCURRED,
  syntaxError,
});

export const fetchValidation = (namespace: {
  database: string;
  collection: string;
}): SchemaValidationThunkAction<void> => {
  return (dispatch, _getState, { dataService }) => {
    dataService.collectionInfo(namespace.database, namespace.collection).then(
      (collInfo) => {
        const validation = validationFromCollection(null, collInfo ?? {});

        if (!validation.validator) {
          const newValidation = { ...validation, validator: '{}' };
          dispatch(validationFetched(newValidation));
          dispatch(isLoadedChanged(true));
          return;
        }

        // TODO(COMPASS-4989): EJSON??
        const newValidation = {
          ...validation,
          validator: EJSON.stringify(validation.validator, undefined, 2),
        };

        dispatch(validationFetched(newValidation));
        dispatch(zeroStateChanged(false));
        dispatch(isLoadedChanged(true));
      },
      (err: Error) => {
        dispatch(
          validationFetched({
            ...validationFromCollection(err),
            validator: undefined,
          })
        );
        dispatch(zeroStateChanged(false));
        dispatch(isLoadedChanged(true));
      }
    );
  };
};

export function validationFromCollection(
  err: null | { message: string },
  {
    validation,
  }: {
    validation?: {
      validationAction?: string;
      validationLevel?: string;
      validator?: null | Record<string, unknown>;
    } | null;
  } = {}
): Pick<Validation, 'validationAction' | 'validationLevel'> & {
  error?: { message: string };
  validator?: Record<string, unknown>;
} {
  const { validationAction, validationLevel } = INITIAL_STATE;
  if (err) {
    return { validationAction, validationLevel, error: err };
  }
  return {
    validationAction: (validation?.validationAction ??
      validationAction) as ValidationServerAction,
    validationLevel: (validation?.validationLevel ??
      validationLevel) as ValidationLevel,
    ...(validation?.validator && {
      validator: validation.validator,
    }),
  };
}

/**
 * Save validation.
 */
export const saveValidation = (
  validation: Validation
): SchemaValidationThunkAction<Promise<void>> => {
  return async (dispatch, getState, { dataService, logger: { track } }) => {
    const state = getState();
    const namespace = state.namespace;
    const checkedValidator = checkValidator(validation.validator);
    const savedValidation = {
      validator: checkedValidator.validator,
      validationAction: validation.validationAction,
      validationLevel: validation.validationLevel,
      isChanged: false,
    };

    const trackEvent = {
      validation_action: validation.validationAction,
      validation_level: validation.validationLevel,
    };
    track('Schema Validation Updated', trackEvent);
    try {
      await dataService.updateCollection(
        `${namespace.database}.${namespace.collection}`,
        {
          validator: savedValidation.validator,
          validationAction: savedValidation.validationAction,
          validationLevel: savedValidation.validationLevel,
        }
      );
      dispatch(fetchValidation(namespace));
    } catch (error) {
      dispatch(validationSaveFailed(error as Error));
    }
  };
};

/**
 * Cancel validation.
 *
 * @returns {Function} The function.
 */
export const cancelValidation = () => {
  return (
    dispatch: ThunkDispatch<RootState, unknown, RootAction>,
    getState: () => RootState
  ) => {
    const state = getState();
    const prevValidation = state.validation.prevValidation;

    dispatch(
      validationCanceled({
        isChanged: false,
        validator: prevValidation!.validator,
        validationAction: prevValidation!.validationAction,
        validationLevel: prevValidation!.validationLevel,
        error: null,
      })
    );
    dispatch(clearSampleDocuments());

    return;
  };
};

/**
 * Activate validation.
 *
 * @returns {Function} The function.
 */
export const activateValidation = (): SchemaValidationThunkAction<void> => {
  return (dispatch, getState) => {
    const state = getState();
    const namespace = state.namespace;

    dispatch(fetchValidation(namespace));
  };
};

interface Rules {
  bsonType?: string;
  description?: string;
  required?: string[];
  properties?: Record<string, Rules>;
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  maximum?: number;
  items?: Rules;
}

const AnalyzeTypesToBsonTypes: Record<string, string> = {
  Double: 'double',
  String: 'string',
  Document: 'object',
  Array: 'array',
  Binary: 'binData',
  Undefined: 'undefined',
  ObjectId: 'objectId',
  Boolean: 'bool',
  Date: 'date',
  Null: 'null',
  RegExp: 'regex',
  Code: 'javascript',
  BSONSymbol: 'symbol',
  Int32: 'int',
  Timestamp: 'timestamp',
  Int64: 'long',
  Decimal128: 'decimal',
  MinKey: 'minKey',
  MaxKey: 'maxKey',
};

const naturalJoin = (bits: string[]) => {
  if (!bits.length) return '';
  if (bits.length === 1) return bits[0];

  const last = bits.pop() || '';
  return `${bits.join(', ')} and ${last}`;
};

const withA = (word: string) =>
  ['a', 'e', 'i', 'o', 'u', 'y'].includes(word[0]) ? `an ${word}` : `a ${word}`;

const getDescription = (
  name: string,
  rules: Omit<Rules, 'description'>,
  isRequired: boolean
) => {
  const bits: string[] = [];
  if (rules.bsonType) bits.push(`must be ${withA(rules.bsonType)}`);
  if (rules.items && rules.items.bsonType)
    bits.push(`of ${rules.items.bsonType}'s`);
  if (rules.minItems) bits.push(`with min ${rules.minItems} items`);
  if (rules.maxItems) bits.push(`with max ${rules.maxItems} items`);
  if (rules.minimum && rules.maximum) {
    bits.push(`between ${rules.minimum} and ${rules.maximum}`);
  } else if (rules.minimum) {
    bits.push(`minimum ${rules.minimum}`);
  } else if (rules.maximum) {
    bits.push(`maximum ${rules.maximum}`);
  }
  if (isRequired) bits.push('is required');
  return bits.length ? `'${name}' ${naturalJoin(bits)}` : '';
};

const getDocumentRules = ({ fields }: DocumentSchemaType) => {
  const { properties, required } = parseRules(fields);
  return { properties, required };
};

const getArrayRules = ({ lengths, types }: ArraySchemaType): Partial<Rules> => {
  if (!lengths.length) return {};

  const rules: Partial<Rules> & { minItems: number; maxItems: number } = {
    minItems: lengths[0],
    maxItems: lengths[0],
  };

  for (const length of lengths) {
    if (length < rules.minItems) rules.minItems = length;
    if (length > rules.maxItems) rules.maxItems = length;
  }

  if (types.length === 1) {
    rules.items = {
      bsonType: AnalyzeTypesToBsonTypes[types[0].bsonType],
    };
  }

  return rules;
};

const getDigits = (number: number) => Math.round(number).toString().length;
const getRoundFloor = (number: number) => Math.pow(10, getDigits(number) - 1);
const getRoundCeil = (number: number) => Math.pow(10, getDigits(number));

const getNumericRules = ({ values }: { values: number[] }) => {
  if (!values.length) return {};

  let min: number = values[0];
  let max: number = values[0];

  for (const num of values) {
    if (num < min) min = num;
    if (num > max) max = num;
  }

  return {
    minimum: getRoundFloor(min),
    maximum: getRoundCeil(max),
  };
};

const getTypeSpecificRules = (
  bsonType: string,
  schema: SchemaType
): Partial<Rules> => {
  switch (bsonType) {
    case 'object':
      return getDocumentRules(schema as DocumentSchemaType);
    case 'array':
      return getArrayRules(schema as ArraySchemaType);
    case 'double':
    case 'int':
    case 'long':
    case 'decimal':
      return getNumericRules(schema as unknown as { values: number[] });
    default:
      return {};
  }
};

const parseRules = (fields: SchemaField[]) => {
  const required: string[] = [];
  const properties: Record<string, Rules> = {};

  fields.forEach(({ name, types, probability }) => {
    const rules: Rules = {};

    let isRequired = false;
    if (probability === 1) {
      isRequired = true;
      required.push(name);
    }

    types = types.filter(
      ({ bsonType: analyzeType }) => analyzeType !== 'Undefined'
    );

    const bsonType =
      types.length === 1 && AnalyzeTypesToBsonTypes[types[0].bsonType];
    if (bsonType) {
      rules.bsonType = bsonType;
      const typeSpecificRules = getTypeSpecificRules(bsonType, types[0]);
      Object.assign(rules, typeSpecificRules);
    }

    const description = getDescription(name, rules, isRequired);
    if (description) {
      rules.description = description;
    }

    if (Object.keys(rules).length) {
      properties[name] = rules;
    }
  });

  return { properties, required };
};

export const generateValidator = (): SchemaValidationThunkAction<
  Promise<void>
> => {
  return async (dispatch, getState, { dataService }) => {
    const { namespace } = getState();

    const docs = await dataService.sample(
      namespace.toString(),
      undefined, // query
      {
        // aggregateOptions
        promoteValues: false,
      },
      {
        // abortSignal,
      }
    );
    const { fields } = await mongodbSchema(docs);

    console.log('fields', fields);
    const { properties, required } = parseRules(fields);

    const validator = {
      $jsonSchema: {
        bsonType: 'object',
        title: `${namespace.collection} validation`,
        required,
        properties,
      },
    };

    try {
      dispatch(zeroStateChanged(false));
      dispatch(validatorChanged(JSON.stringify(validator, null, 2)));
    } catch (e) {
      // TODO error toast
    }
  };
};
