import {
  BSON_TYPES,
  ACCUMULATORS,
  EXPRESSION_OPERATORS,
  CONVERSION_OPERATORS,
  QUERY_OPERATORS,
  STAGE_OPERATORS,
} from '@mongodb-js/mongodb-constants';
import type { AceMode, HighlightRules } from '../types';

// Copied from the original javascript highligher
// https://github.com/ajaxorg/ace/blob/86d47fa9681e1e82b7bffd3a7ffd5ab0368d1301/src/mode/javascript_highlight_rules.js#L8
const identifierRe = '[a-zA-Z\\$_\u00a1-\uffff][a-zA-Z\\d\\$_\u00a1-\uffff]*';

function toMapperVal(items: readonly { value: string }[]): string {
  return items
    .map((item) => {
      return item.value;
    })
    .join('|');
}

ace.define(
  'ace/mode/mongodb_highlight_rules',
  [
    'require',
    'exports',
    'module',
    'ace/lib/oop',
    'ace/mode/javascript_highlight_rules',
  ],
  function (acequire, exports) {
    const oop = acequire('../lib/oop');
    const { JavaScriptHighlightRules } = acequire(
      './javascript_highlight_rules'
    );

    // MongoDB highligher is just javascript highligher with overriden
    // identifier mapper
    function MongoDBHighlightRules(this: HighlightRules, ...args: unknown[]) {
      oop.mixin(this, new JavaScriptHighlightRules(...args));

      const keywordMapper = this.createKeywordMapper(
        {
          // BSON types are mapped as global vars
          'variable.language.bson': toMapperVal(BSON_TYPES),

          // Operator are mapped as functions (see README for context)
          'support.function.accumulator': toMapperVal(ACCUMULATORS),
          'support.function.expression_op': toMapperVal(EXPRESSION_OPERATORS),
          'support.function.conversion_op': toMapperVal(CONVERSION_OPERATORS),
          'support.function.query_op': toMapperVal(QUERY_OPERATORS),
          'support.function.stage_op': toMapperVal(STAGE_OPERATORS),

          // These are copied over from default javascript highligher
          // https://github.com/ajaxorg/ace/blob/86d47fa9681e1e82b7bffd3a7ffd5ab0368d1301/src/mode/javascript_highlight_rules.js#L12-L38
          'storage.type': 'const|let|var|function',
          'constant.language': 'null|Infinity|NaN|undefined',
          'constant.language.boolean': 'true|false',
        },
        'identifier'
      );
      const identifierRule = this.$rules.no_regex.find((rule) => {
        return rule.regex === identifierRe;
      });

      // Overriding original identifier rule depends on the identifier regex
      // that was copied over from original javascript highligher. If this
      // starts throwing at any point, this means that javascript mode in ace
      // editor changed significantly and this code needs an update
      if (!identifierRule) {
        throw new Error(
          "Couldn't find original identifier rule. Check that the rule find operation is working correcty"
        );
      }

      identifierRule.token = keywordMapper;

      this.normalizeRules();
    }
    oop.inherits(MongoDBHighlightRules, JavaScriptHighlightRules);
    exports.MongoDBHighlightRules = MongoDBHighlightRules;
  }
);

ace.define(
  'ace/mode/mongodb',
  [
    'require',
    'exports',
    'module',
    'ace/lib/oop',
    'ace/mode/javascript',
    'ace/mode/mongodb_highlight_rules',
  ],
  function (acequire, exports) {
    const oop = acequire('../lib/oop');
    const { Mode: JavaScriptMode } = acequire('./javascript');
    const { MongoDBHighlightRules } = acequire('./mongodb_highlight_rules');
    // MongoDB mode is just javascript mode with a slightly modified highligher
    // (see highligher code above for details)
    function MongoDBMode(this: AceMode, ...args: unknown[]) {
      oop.mixin(this, new JavaScriptMode(...args));
      this.HighlightRules = MongoDBHighlightRules;
      // We completely disable javascript worker because the one packaged with
      // javascript mode doesn't work correctly when parsing queries or
      // aggregations showing confusing errors in the editor
      this.createWorker = () => {
        return null;
      };
    }
    oop.inherits(MongoDBMode, JavaScriptMode);
    exports.Mode = MongoDBMode;
  }
);
