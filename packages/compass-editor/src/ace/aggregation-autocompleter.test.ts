import type { Ace } from 'ace-builds';
import { EditSession } from 'ace-builds';
import { Mode } from 'ace-builds/src-noconflict/mode-javascript';
import {
  AggregationAutoCompleter,
  getScopeTokensBefore,
} from './aggregation-autocompleter';
import { setupCompleter, getDefaultPos } from '../../test/completer';
import { expect } from 'chai';
import { STAGE_OPERATOR_NAMES } from '@mongodb-js/mongodb-constants';
import type { CompletionWithServerInfo } from '../types';

const setupAggregationCompleter = setupCompleter.bind(
  null,
  AggregationAutoCompleter
);

function getTokens(text: string, pos?: Ace.Position) {
  const session = new EditSession(text, new Mode());
  return Array.from(getScopeTokensBefore(session, pos ?? getDefaultPos(text)));
}

describe('AggregationAutoCompleter', function () {
  context('when autocompleting outside of stage', function () {
    context('with empty pipeline', function () {
      it('should return stages', function () {
        const { getCompletions } = setupAggregationCompleter('[{ $');
        getCompletions(function (err, completions) {
          expect(err).to.be.null;
          expect(
            completions.map((completion) => completion.name).sort()
          ).to.deep.eq([...STAGE_OPERATOR_NAMES].sort());
        });
      });
    });

    context('with other stages in the pipeline', function () {
      it('should return stages', function () {
        const { getCompletions } = setupAggregationCompleter(
          '[{$match:{foo: 1}},{$'
        );
        getCompletions(function (err, completions) {
          expect(err).to.be.null;
          expect(
            completions.map((completion) => completion.name).sort()
          ).to.deep.eq([...STAGE_OPERATOR_NAMES].sort());
        });
      });

      context('with the cursor in front of existing stages', function () {
        it('should return stages', function () {
          const { getCompletions } = setupAggregationCompleter(
            '[{$ },{$match:{foo: 1}}]',
            { pos: { row: 0, column: 3 } }
          );
          getCompletions(function (err, completions) {
            expect(err).to.be.null;
            expect(
              completions.map((completion) => completion.name).sort()
            ).to.deep.eq([...STAGE_OPERATOR_NAMES].sort());
          });
        });
      });
    });

    context('inside block', function () {
      it('should not suggest blocks in snippets', function () {
        const { getCompletions } = setupAggregationCompleter(
          `[{\n /** comment */ $`
        );
        getCompletions(function (err, completions) {
          expect(
            completions.every(
              (completion) =>
                !(completion as CompletionWithServerInfo).snippet?.startsWith(
                  '{'
                )
            )
          ).to.eq(
            true,
            'Expected every completion to not start with an opening paren'
          );
        });
      });
    });

    context('outside block', function () {
      it('should have blocks in snippets', function () {
        const { getCompletions } = setupAggregationCompleter(
          `[{ $match: {foo: 1} }, $`
        );
        getCompletions(function (err, completions) {
          expect(
            completions.every((completion) =>
              (completion as CompletionWithServerInfo).snippet?.startsWith('{')
            )
          ).to.eq(
            true,
            'Expected every completion to start with an opening paren'
          );
        });
      });
    });
  });

  context('when autocompleting inside the stage', function () {
    it('should return stage completer results', function () {
      const { getCompletions } = setupAggregationCompleter(
        '[{$bucket: { _id: "$',
        {
          fields: [
            { name: 'foo', value: 'foo', score: 1, version: '0.0.0' },
            { name: 'bar', value: 'bar', score: 1, version: '0.0.0' },
          ],
        }
      );
      getCompletions(function (err, completions) {
        expect(err).to.be.null;
        expect(completions.map((completion) => completion.name)).to.deep.eq([
          '$foo',
          '$bar',
        ]);
      });
    });
  });

  describe('getScopeTokensBefore', function () {
    const cases: ([string, string[]] | [string, string[], Ace.Position])[] = [
      ['[{ foo: 1 }, { bar', []],
      ['[{ bla: 1 }, { foo: { bar', ['foo']],
      ['[{ foo: { bar: { buz', ['bar', 'foo']],
      ['[{ bla: { meow: { wow: 1 } } }, { foo: { bar: { buz', ['bar', 'foo']],
      [
        '[{ bla: { meow: { wow: 1 } } }, { foo: { bar: { buz',
        ['meow', 'bla'],
        { row: 0, column: 20 },
      ],
      [
        '[\n{ bla: { meow: { wow: 1 } } },\n{ foo: { bar: { buz',
        ['bar', 'foo'],
      ],
      ['[{foo:{bar:{buz:1}}},{bla', []],
      ['[{foo:{bar:1}},{bla', []],
      ['[{foo:{bar:1}},/*{foo:*/{bla', []],
      ['[{foo:{bar:1}},//{foo:\n{bla', []],
      ['[{foo:{bar:1}},//{foo:\n{bla', []],
      ['[{foo:{\nbar', ['foo']],
    ];
    cases.forEach(function ([code, expected, pos]) {
      const escapedCode = code.replace(/\n/g, '\\n');
      const position = pos ? ` at ${pos.row}:${pos.column}` : '';
      const expectedTokens =
        expected.length > 0
          ? expected.join(', ') + ' in exactly the same order'
          : 'no tokens';

      context(`for "${escapedCode}"${position} `, function () {
        it(`should return ${expectedTokens}`, function () {
          const tokens = getTokens(code, pos)
            .filter((token) => token.type === 'identifier')
            .map((token) => token.value);
          expect(tokens).to.deep.eq(expected);
        });
      });
    });
  });
});
