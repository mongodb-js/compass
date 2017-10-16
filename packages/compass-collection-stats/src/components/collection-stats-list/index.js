import statsFactory from './collection-stats-list.jsx';

/**
 * The invalid text.
 */
const INVALID = 'N/A';

/**
 * Documents constant.
 */
const DOCUMENTS = 'Documents';

/**
 * Indexes constant.
 */
const INDEXES = 'Indexes';

/**
 * Total size constant.
 */
const TOTAL_SIZE = 'total size';

/**
 * Average size constant.
 */
const AVG_SIZE = 'avg. size';


const DocumentsStatsList = statsFactory({
  displayName: 'DocumentsStatsList',
  defaults: {
    documentCount: INVALID,
    totalIndexSize: INVALID,
    avgIndexSize: INVALID
  },
  items: [
    { label: DOCUMENTS, value: 'documentCount' },
    { label: TOTAL_SIZE, value: 'totalDocumentSize' },
    { label: AVG_SIZE, value: 'avgDocumentSize' }
  ]
});

const IndexStatsList = statsFactory({
  displayName: 'IndexesStatsList',
  defaults: {
    indexCount: INVALID,
    totalIndexSize: INVALID,
    avgIndexSize: INVALID
  },
  items: [
    { label: INDEXES, value: 'indexCount' },
    { label: TOTAL_SIZE, value: 'totalIndexSize' },
    { label: AVG_SIZE, value: 'avgIndexSize' }
  ]
});

export { IndexStatsList, DocumentsStatsList };
