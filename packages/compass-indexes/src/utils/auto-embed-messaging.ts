import type { TranslateFn } from '@mongodb-js/compass-components';

/** Edit-mode warning for autoEmbed indexes, gated on `enableAutoEmbeddingGaRelease`. */
export const getAutoEmbedEditCostWarning = (t: TranslateFn) =>
  t(
    'indexes.autoEmbed.editCostWarning',
    'Changing quantization, model name, or dimensions will trigger new embedding calls. This may incur additional embedding cost.'
  );
