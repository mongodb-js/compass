import user_1270 from './user_1.27.0.json';
import user_1310 from './user_1.31.0.json';
import user_1380 from './user_1.38.0.json';

export const users = [
  {
    version: '1.27.0',
    data: user_1270,
  },
  {
    version: '1.31.0',
    data: user_1310,
  },
  {
    version: '1.38.0',
    data: user_1380,
  },
] as const;
