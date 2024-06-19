import ConnectionForm, { ColorCircleGlyph } from './components/connection-form';
import ConnectionFormModal from './components/connection-form-modal';
import SaveConnectionModal from './components/save-connection-modal';
import { adjustConnectionOptionsBeforeConnect } from './hooks/use-connect-form';

export {
  SaveConnectionModal,
  adjustConnectionOptionsBeforeConnect,
  ConnectionFormModal,
  ColorCircleGlyph,
};

export {
  legacyColorsToColorCode,
  useConnectionColor,
  DefaultColorCode,
  CONNECTION_COLOR_CODES,
} from './hooks/use-connection-color';

export default ConnectionForm;
