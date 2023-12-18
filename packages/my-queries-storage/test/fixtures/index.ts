import pipeline1270 from './pipeline_1.27.0.json';
import pipeline1310 from './pipeline_1.31.0.json';
import pipeline1380 from './pipeline_1.38.0.json';

import recentQuery1270 from './recent_query_1.27.0.json';
import recentQuery1310 from './recent_query_1.31.0.json';
import recentQuery1380 from './recent_query_1.38.0.json';

import favoriteQuery1270 from './favorite_query_1.27.0.json';
import favoriteQuery1310 from './favorite_query_1.31.0.json';
import favoriteQuery1380 from './favorite_query_1.38.0.json';

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

export const recentQueries = [
  {
    version: '1.27.0',
    query: recentQuery1270,
  },
  {
    version: '1.31.0',
    query: recentQuery1310,
  },
  {
    version: '1.38.0',
    query: recentQuery1380,
  },
] as const;

export const favoriteQueries = [
  {
    version: '1.27.0',
    query: favoriteQuery1270,
  },
  {
    version: '1.31.0',
    query: favoriteQuery1310,
  },
  {
    version: '1.38.0',
    query: favoriteQuery1380,
  },
] as const;
