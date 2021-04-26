/* eslint-disable no-sync */
import * as babel from '@babel/core';
import runtimeSupport from './runtime-support.nocov';
import wrapAsFunctionPlugin from './stages/wrap-as-iife';
import makeMaybeAsyncFunctionPlugin from './stages/transform-maybe-await';
import { AsyncRewriterErrors } from './error-codes';

/**
 * General notes for this package:
 *
 * This package contains two babel plugins used in async rewriting, plus a helper
 * to apply these plugins to plain code.
 *
 * If you have not worked with babel plugins,
 * https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md
 * may be a good resource for starting with this.
 *
 * https://astexplorer.net/ is also massively helpful, and enables working
 * with babel plugins as live transformers. It doesn't understand all TS syntax,
 * but pasting the compiled output from lib/stages/[...].js is already
 * a very good start.
 *
 * The README file for this repository contains a more high-level technical
 * overview.
 */

export default class AsyncWriter {
  step(code: string, plugins: babel.PluginItem[]): string {
    return babel.transformSync(code, {
      plugins,
      code: true,
      configFile: false,
      babelrc: false,
      compact: code.length > 10_000
    })?.code as string;
  }

  /**
   * Returns translated code.
   * @param code - string to compile.
   */
  process(code: string): string {
    try {
      // In the first step, we apply a number of common babel transformations
      // that are necessary in order for subsequent steps to succeed
      // (in particular, shorthand properties and parameters would otherwise
      // mess with detecting expressions in their proper locations).
      code = this.step(code, [
        require('@babel/plugin-transform-shorthand-properties').default,
        require('@babel/plugin-transform-parameters').default,
        require('@babel/plugin-transform-destructuring').default
      ]);
      code = this.step(code, [wrapAsFunctionPlugin]);
      code = this.step(code, [
        [
          makeMaybeAsyncFunctionPlugin,
          { customErrorBuilder: babel.types.identifier('MongoshAsyncWriterError') }
        ]
      ]);
      return code;
    } catch (e) {
      e.message = e.message.replace('unknown: ', '');
      throw e;
    }
  }

  runtimeSupportCode(): string {
    // The definition of MongoshAsyncWriterError is kept separately from other
    // code, as it is one of the few actually mongosh-specific pieces of code here.
    return this.process(`
    class MongoshAsyncWriterError extends Error {
      constructor(message, codeIdentifier) {
        const code = (${JSON.stringify(AsyncRewriterErrors)})[codeIdentifier];
        super(\`[\${code}] \${message}\`);
        this.code = code;
      }
    }
    ${runtimeSupport}`);
  }
}
