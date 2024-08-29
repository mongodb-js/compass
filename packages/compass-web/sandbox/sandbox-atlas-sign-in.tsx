import React, { useCallback, useEffect, useState } from 'react';
import { css, Link, openToast } from '@mongodb-js/compass-components';

// eslint-disable-next-line no-console
console.info('call window.__signIn() to sign in to Atlas Cloud proxy');
// eslint-disable-next-line no-console
console.info('call window.__signOut() to sign out from Atlas Cloud proxy');

type SignInStatus = 'checking' | 'signed-in' | 'signed-out';

type AtlasLoginReturnValue =
  | {
      status: 'checking' | 'signed-out';
      projectId: null;
    }
  | { status: 'signed-in'; projectId: string };

const bodyContainerStyles = css({
  display: 'flex',
  minWidth: 0,
  width: '100%',
});

const descriptionStyles = css({
  flex: 1,
  minWidth: 0,
});

const actionLabelStyles = css({
  flex: 'none',
  // To center-align against the title
  marginTop: '-20px',
});

function ToastBodyWithAction({
  description,
  actionLabel,
  onActionClick,
}: {
  description: string;
  actionLabel: string;
  onActionClick: () => void;
}) {
  return (
    <span className={bodyContainerStyles}>
      <span className={descriptionStyles}>{description}</span>
      <Link className={actionLabelStyles} onClick={onActionClick}>
        {actionLabel}
      </Link>
    </span>
  );
}

export function useAtlasProxySignIn(): AtlasLoginReturnValue {
  const [status, setStatus] = useState<SignInStatus>('checking');
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void fetch('/projectId')
      .then(async (res) => {
        const projectId = await res.text();
        if (mounted) {
          if (!projectId) {
            throw new Error('failed to get projectId');
          }
          setProjectId(projectId);
          setStatus('signed-in');
          openToast('atlas-proxy', {
            title: 'Signed in to local Atlas Cloud proxy',
            description: (
              <ToastBodyWithAction
                description="Sign out to connect with connection string"
                actionLabel="Sign out"
                onActionClick={() => {
                  void signOut();
                }}
              ></ToastBodyWithAction>
            ),
          });
        }
      })
      .catch(() => {
        if (mounted) {
          setStatus('signed-out');
          if (
            process.env.ci ||
            process.env.CI ||
            process.env.IS_CI ||
            process.env.NODE_ENV === 'test' ||
            process.env.APP_ENV === 'webdriverio'
          ) {
            return;
          }
          openToast('atlas-proxy', {
            title: 'Sign in to Atlas Cloud',
            description: (
              <ToastBodyWithAction
                description="Sign in to local Atlas Cloud proxy to use sandbox with Atlas Cloud clusters"
                actionLabel="Sign in"
                onActionClick={() => {
                  void signIn();
                }}
              ></ToastBodyWithAction>
            ),
          });
        }
      });
    return () => {
      mounted = false;
    };
  });

  const signIn = ((window as any).__signIn = useCallback(async () => {
    try {
      const { projectId } = await fetch('/authenticate', {
        method: 'POST',
      }).then((res) => {
        return res.json() as Promise<{ projectId: string }>;
      });
      if (projectId) {
        window.location.reload();
      }
    } catch (err) {
      openToast('atlas-proxy', {
        title: 'Failed to sign in',
        description: (err as any).message,
      });
    }
  }, []));

  const signOut = ((window as any).__signOut = useCallback(() => {
    return fetch('/logout').then(
      () => {
        window.location.reload();
      },
      () => {
        // noop
      }
    );
  }, []));

  if (status === 'checking' || status === 'signed-out') {
    return {
      status,
      projectId: null,
    };
  }

  if (status === 'signed-in' && projectId) {
    return { status, projectId };
  }

  throw new Error('Weird state, ask for help in Compass dev channel');
}
