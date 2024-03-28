import { createElement } from 'react';
import { openToast } from '@mongodb-js/compass-components';
import { RestartCompassToastContent } from '../components/restart-compass-toast-content';

export function onAutoupdateStarted() {
  openToast('update-download', {
    variant: 'progress',
    title: 'Compass update is in progress',
  });
}
export function onAutoupdateFailed() {
  openToast('update-download', {
    variant: 'warning',
    title: 'Failed to download Compass update',
    description: 'Downloading a newer Compass version failed',
  });
}
export function onAutoupdateSuccess({
  onUpdate,
  onDismiss,
}: {
  onUpdate: () => void;
  onDismiss: () => void;
}) {
  openToast('update-download', {
    variant: 'note',
    title: 'Restart to start newer Compass version',
    description: createElement(RestartCompassToastContent, {
      onUpdateClicked: onUpdate,
    }),
    dismissible: true,
    onClose: onDismiss,
  });
}
