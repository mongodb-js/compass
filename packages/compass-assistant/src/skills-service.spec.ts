import { expect } from 'chai';
import sinon from 'sinon';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import { SkillsService } from './skills-service';

function createAtlasService(body: unknown) {
  return {
    assistantApiEndpoint: (path: string) => `http://example.com/api/v1/${path}`,
    fetch: sinon.stub().resolves(new Response(JSON.stringify(body))),
  } as unknown as AtlasService & { fetch: sinon.SinonStub };
}

describe('SkillsService', function () {
  describe('getSkills', function () {
    it('requests the skills endpoint and returns the skills', async function () {
      const skill = {
        name: 'mongodb-schema-design',
        description: 'Guides schema design decisions for MongoDB...',
        version: '1.2.0',
        url: 'https://github.com/mongodb/agent-skills/blob/main/skills/mongodb-schema-design/SKILL.md',
      };
      const atlasService = createAtlasService({ skills: [skill] });
      const service = new SkillsService(atlasService);

      expect(await service.getSkills()).to.deep.equal([skill]);
      expect(atlasService.fetch.firstCall.args[0]).to.equal(
        'http://example.com/api/v1/content/skills'
      );
    });

    it('returns an empty array when the server has no skills', async function () {
      const service = new SkillsService(createAtlasService({ skills: [] }));
      expect(await service.getSkills()).to.deep.equal([]);
    });
  });
});
