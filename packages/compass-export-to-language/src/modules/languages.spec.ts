import { expect } from 'chai';
import {
  outputLanguageToCodeLanguage,
  codeLanguageToOutputLanguage,
} from './languages';
import type { OutputLanguage } from './languages';

const knownLanguages = [
  { transpiler: 'java', leafygreen: 'java', display: 'Java' },
  { transpiler: 'javascript', leafygreen: 'javascript', display: 'Node' },
  { transpiler: 'csharp', leafygreen: 'cs', display: 'C#' },
  { transpiler: 'python', leafygreen: 'python', display: 'Python' },
  { transpiler: 'ruby', leafygreen: 'ruby', display: 'Ruby' },
  { transpiler: 'go', leafygreen: 'go', display: 'Go' },
  { transpiler: 'rust', leafygreen: 'rust', display: 'Rust' },
  { transpiler: 'php', leafygreen: 'php', display: 'PHP' },
];

describe('Languages', function () {
  describe('outputLanguageToCodeLanguage', function () {
    it('maps bson-transpiler languages to Leafygreen languages', function () {
      for (const language of knownLanguages) {
        // For some reason if you pass languageOptions to leafygreen's Code
        // component (which we do) it matches on the displayName, not the
        // language. This is inconsistent with when you don't specify
        // languageOptions where it will use the language and not the
        // displayName.
        expect(
          outputLanguageToCodeLanguage(language.transpiler as OutputLanguage)
        ).to.equal(language.display);
      }
    });
  });

  describe('codeLanguageToOutputLanguage', function () {
    it('maps Leafygreen languages to bson transpiler languages', function () {
      for (const language of knownLanguages) {
        // The leafygreen Code component's onChange() passes the entire
        // languageOption so we can use the leafygreen language (rather than
        // displayName) in that case.
        expect(codeLanguageToOutputLanguage(language.leafygreen)).to.equal(
          language.transpiler
        );
      }
    });
  });
});
