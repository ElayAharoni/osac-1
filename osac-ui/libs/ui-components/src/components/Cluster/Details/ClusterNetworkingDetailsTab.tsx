import { Stack, StackItem } from '@patternfly/react-core';

import type { Cluster } from '@osac/types';

import ClusterExternalIpCard from './ClusterExternalIpCard';
import ClusterNetworkingCard from './ClusterNetworkingCard';

interface ClusterNetworkingDetailsTabProps {
  cluster: Cluster;
}

export const ClusterNetworkingDetailsTab = ({ cluster }: ClusterNetworkingDetailsTabProps) => {
  return (
    <Stack hasGutter>
      <StackItem>
        <ClusterNetworkingCard cluster={cluster} />
      </StackItem>
      <StackItem>
        <ClusterExternalIpCard cluster={cluster} />
      </StackItem>
    </Stack>
  );
};
