import type { AtlasService } from '@mongodb-js/atlas-service/provider';

export type Skill = {
  name: string;
  description: string;
  url: string;
  version?: string;
};

export class SkillsService {
  private readonly atlasService: AtlasService;

  constructor(atlasService: AtlasService) {
    this.atlasService = atlasService;
  }

  async getSkills({ signal }: { signal?: AbortSignal } = {}): Promise<Skill[]> {
    const res = await this.atlasService.fetch(
      this.atlasService.assistantApiEndpoint('content/skills'),
      { signal }
    );
    const { skills } = (await res.json()) as { skills?: Skill[] };
    return skills ?? [];
  }
}
