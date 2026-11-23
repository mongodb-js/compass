import { expect } from 'chai';
import {
  directivesToDisplayText,
  directivesToSkillTags,
  toDisplayName,
} from './skill-directives';

describe('skill directives', function () {
  describe('directivesToSkillTags', function () {
    it('wraps skills in <skill> tags using the full id', function () {
      expect(
        directivesToSkillTags(':skill[query]{id=mongodb-query} help')
      ).to.equal('<skill>mongodb-query</skill> help');
    });

    it('wraps tools in <tool> tags without the id prefix', function () {
      expect(
        directivesToSkillTags(
          ':skill[get-current-query]{id=tool:get-current-query} explain'
        )
      ).to.equal('<tool>get-current-query</tool> explain');
    });

    it('reads the id when the directive also carries a source', function () {
      expect(
        directivesToSkillTags(
          ':skill[query]{id=mongodb-query source=https://example.com/query} help'
        )
      ).to.equal('<skill>mongodb-query</skill> help');
    });

    it('falls back to the label when the directive has no id', function () {
      expect(directivesToSkillTags(':skill[mongodb-query] help')).to.equal(
        '<skill>mongodb-query</skill> help'
      );
    });

    it('handles several skills and tools in one prompt', function () {
      expect(
        directivesToSkillTags(
          ':skill[a]{id=mongodb-a} and :skill[find]{id=tool:find} then :skill[b]{id=mongodb-b}'
        )
      ).to.equal(
        '<skill>mongodb-a</skill> and <tool>find</tool> then <skill>mongodb-b</skill>'
      );
    });

    it('leaves text without directives unchanged', function () {
      expect(
        directivesToSkillTags('how do I /index a <skill> field?')
      ).to.equal('how do I /index a <skill> field?');
    });
  });

  describe('directivesToDisplayText', function () {
    it('shows the shortened label as a slash command', function () {
      expect(
        directivesToDisplayText(':skill[query]{id=mongodb-query} help')
      ).to.equal('/query help');
    });

    it('shows tools the same way', function () {
      expect(
        directivesToDisplayText(':skill[find]{id=tool:find} in users')
      ).to.equal('/find in users');
    });

    it('does not leak the id or source', function () {
      expect(
        directivesToDisplayText(
          ':skill[query]{id=mongodb-query source=https://example.com/query}'
        )
      ).to.equal('/query');
    });
  });

  describe('toDisplayName', function () {
    it('drops the mongodb- prefix', function () {
      expect(toDisplayName('mongodb-query')).to.equal('query');
    });

    it('keeps names without the prefix', function () {
      expect(toDisplayName('custom-skill')).to.equal('custom-skill');
    });
  });
});
