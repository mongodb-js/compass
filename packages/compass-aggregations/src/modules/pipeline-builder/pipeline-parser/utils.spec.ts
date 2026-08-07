import * as babelParser from '@babel/parser';
import { expect } from 'chai';
import { Code } from 'bson';
import { toJSString } from 'mongodb-query-parser';
import { generate, parseShellBSON } from './utils';

describe('PipelineParser Utils', function () {
  it('generates pretty code', function () {
    const pipeline = generate(
      babelParser.parseExpression(
        `[// Stage comment \n{$match: {name: /berlin/i, country: 'Germany'}}]`
      )
    );
    expect(pipeline).to.equal(
      [
        '[',
        '  // Stage comment',
        '  {',
        '    $match: {',
        '      name: /berlin/i,',
        '      country: "Germany"',
        '    }',
        '  }',
        ']',
      ].join('\n')
    );
  });

  describe('Code value serialization', function () {
    const MARKER = '__compass_test_marker__';

    const marker = () =>
      (globalThis as unknown as Record<string, unknown>)[MARKER];
    const clearMarker = () => {
      delete (globalThis as unknown as Record<string, unknown>)[MARKER];
    };

    type ParsedPipeline = [
      { $match: { $where: { code: string; scope?: Record<string, string> } } }
    ];

    const payloads = [
      `'`,
      `\\'`,
      `"`,
      `\\"`,
      `\``,
      `'), globalThis['${MARKER}'] = true, Code('`,
      `'); globalThis['${MARKER}'] = true; //`,
      `") ; globalThis['${MARKER}'] = true; //`,
      `') + (({}).constructor.constructor('globalThis[\\'${MARKER}\\'] = true')()) + ('`,
      `') + [].constructor.constructor('globalThis['${MARKER}'] = true')() + ('`,
      `') + Function('globalThis[\\'${MARKER}\\'] = true')() + ('`,
      `'\n; globalThis['${MARKER}'] = true; '`,
      `'\r\n; globalThis['${MARKER}'] = true; '`,
    ];

    beforeEach(clearMarker);
    afterEach(clearMarker);

    for (const payload of payloads) {
      describe(`payload ${JSON.stringify(payload)}`, function () {
        it('serializes the code as a single escaped string literal', function () {
          const source = toJSString([
            { $match: { $where: new Code(payload) } },
          ]) as string;

          expect(source).to.not.include(`Code('${payload}`);
          expect(source).to.include(`Code(${JSON.stringify(payload)}`);
        });

        it('round-trips through parseShellBSON without evaluating the payload', function () {
          const source = toJSString([
            { $match: { $where: new Code(payload) } },
          ]) as string;

          const parsed = parseShellBSON<ParsedPipeline>(source);

          expect(parsed[0].$match.$where.code).to.equal(payload);
          expect(marker()).to.equal(undefined);
        });

        it('round-trips a Code with a scope as well', function () {
          const source = toJSString([
            {
              $match: {
                $where: new Code(payload, { [MARKER]: payload }),
              },
            },
          ]) as string;

          const parsed = parseShellBSON<ParsedPipeline>(source);

          expect(parsed[0].$match.$where.code).to.equal(payload);
          expect(parsed[0].$match.$where.scope?.[MARKER]).to.equal(payload);
          expect(marker()).to.equal(undefined);
        });

        it('round-trips a Code with the payload as a scope key', function () {
          const source = toJSString([
            {
              $match: {
                $where: new Code('return true;', { [payload]: 1 }),
              },
            },
          ]) as string;

          const parsed = parseShellBSON<ParsedPipeline>(source);

          expect(parsed[0].$match.$where.code).to.equal('return true;');
          expect(parsed[0].$match.$where.scope?.[payload]).to.equal(1);
          expect(marker()).to.equal(undefined);
        });
      });
    }

    for (const [name, separator] of [
      ['U+2028', '\u2028'],
      ['U+2029', '\u2029'],
    ] as const) {
      it(`does not evaluate a payload containing ${name}`, function () {
        const payload = `${separator}'; globalThis['${MARKER}'] = true; '`;
        const source = toJSString([
          { $match: { $where: new Code(payload) } },
        ]) as string;

        expect(source).to.not.include(`Code('${payload}`);

        try {
          const parsed = parseShellBSON<ParsedPipeline>(source);
          expect(parsed[0].$match.$where.code).to.equal(payload);
        } catch (err) {
          expect(err).to.be.instanceOf(Error);
        }
        expect(marker()).to.equal(undefined);
      });
    }

    it('does not evaluate a payload nested inside a sub-pipeline', function () {
      const pipeline = [
        {
          $lookup: {
            from: 'other',
            pipeline: [
              {
                $addFields: {
                  x: new Code(`'), globalThis['${MARKER}'] = true, Code('`),
                },
              },
            ],
            as: 'joined',
          },
        },
      ];

      const source = toJSString(pipeline) as string;
      const parsed = parseShellBSON(source);

      expect(parsed).to.be.an('array');
      expect(marker()).to.equal(undefined);
    });
  });
});
