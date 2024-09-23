import type { AtlasService } from '@mongodb-js/atlas-service/provider';

export class AtlasGlobalWritesService {
  constructor(private atlasService: AtlasService) {}
}
