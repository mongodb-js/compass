import { expect } from 'chai';
import { stripOpenFenceLanguage } from './assistant-chat-message';

describe('AssistantChatMessage', function () {
  describe('stripOpenFenceLanguage', function () {
    it('drops the language of a fence that is still open', function () {
      expect(
        stripOpenFenceLanguage('intro\n\n```javascript\ndb.find({})')
      ).to.equal('intro\n\n```\ndb.find({})');
    });

    it('leaves a closed fence alone', function () {
      const text = 'intro\n\n```javascript\ndb.find({})\n```\n\noutro';
      expect(stripOpenFenceLanguage(text)).to.equal(text);
    });

    it('only touches the open fence when an earlier one is closed', function () {
      expect(
        stripOpenFenceLanguage('```js\nfirst\n```\n\n```javascript\nsecond')
      ).to.equal('```js\nfirst\n```\n\n```\nsecond');
    });

    it('leaves text with no fences alone', function () {
      expect(stripOpenFenceLanguage('no code here')).to.equal('no code here');
    });

    it('handles an open fence with no language', function () {
      expect(stripOpenFenceLanguage('```\ndb.find({})')).to.equal(
        '```\ndb.find({})'
      );
    });

    it('handles a partially streamed language name', function () {
      expect(stripOpenFenceLanguage('```javasc')).to.equal('```');
    });

    it('is stable across calls, despite the shared regex', function () {
      const text = '```javascript\ndb.find({})';
      expect(stripOpenFenceLanguage(text)).to.equal(
        stripOpenFenceLanguage(text)
      );
    });
  });
});
