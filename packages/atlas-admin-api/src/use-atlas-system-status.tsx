import { useEffect, useState } from 'react';
import { useAtlasSignedInUser } from '@mongodb-js/atlas-service/provider';
import { useAtlasAdminApiServiceContext } from './provider';

export type AtlasSystemStatusInfo = {
  /** Public IP address the request originated from. */
  ipAddress: string;
  /**
   * Email the user is logged in with. Undefined when the system status doesn't
   * report a user.
   */
  username?: string;
};

export function useAtlasSystemStatus(): AtlasSystemStatusInfo | undefined {
  const atlasAdminApiService = useAtlasAdminApiServiceContext();
  const signedInUser = useAtlasSignedInUser();
  const [systemStatus, setSystemStatus] = useState<{
    sub: string;
    status: AtlasSystemStatusInfo;
  }>();

  useEffect(() => {
    if (!signedInUser) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { ipAddress, user } =
          await atlasAdminApiService.getSystemStatus();
        if (!cancelled) {
          setSystemStatus({
            sub: signedInUser.sub,
            status: { ipAddress, username: user?.username },
          });
        }
      } catch {
        // Failing to resolve the system status is not worth surfacing.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [atlasAdminApiService, signedInUser]);

  return systemStatus && systemStatus.sub === signedInUser?.sub
    ? systemStatus.status
    : undefined;
}
