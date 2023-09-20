import pipeline1270 from './pipeline_1.27.0.json';
import pipeline1310 from './pipeline_1.31.0.json';
import pipeline1380 from './pipeline_1.38.0.json';

export const pipelines = [
  {
    version: '1.27.0',
    data: pipeline1270,
  },
  {
    version: '1.31.0',
    data: pipeline1310,
  },
  {
    version: '1.38.0',
    data: pipeline1380,
  },
] as const;
