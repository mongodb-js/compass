import { z } from 'zod';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';

const SkillSchema = z.object({
  name: z.string(),
  description: z.string(),
  url: z.string(),
  version: z.string(),
});

const SkillsResponseSchema = z.object({
  skills: z.array(z.unknown()).optional(),
});

export type Skill = z.infer<typeof SkillSchema>;

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
    const { skills } = SkillsResponseSchema.parse(await res.json());
    return (skills ?? []).flatMap((skill) => {
      const parsed = SkillSchema.safeParse(skill);
      return parsed.success ? [parsed.data] : [];
    });
  }
}
