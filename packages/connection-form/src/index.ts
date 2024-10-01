import ConnectionForm, { ColorCircleGlyph } from './components/connection-form';
import ConnectionFormModal from './components/connection-form-modal';
import { adjustConnectionOptionsBeforeConnect } from './hooks/use-connect-form';

export {
  adjustConnectionOptionsBeforeConnect,
  ConnectionFormModal,
  ColorCircleGlyph,
};

export {
  useConnectionColor,
  DefaultColorCode,
  CONNECTION_COLOR_CODES,
} from './hooks/use-connection-color';

export default ConnectionForm;
