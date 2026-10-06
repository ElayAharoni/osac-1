import { useState } from 'react';
import { Stack, StackItem } from '@patternfly/react-core';

import { ExternalIPAttachmentEndpoint } from '@osac/types';
import type { Cluster, ExternalIPAttachment } from '@osac/types';

import AttachExternalIpModal from './AttachExternalIpModal';
import ClusterExternalIpCard from './ClusterExternalIpCard';
import ClusterNetworkingCard from './ClusterNetworkingCard';
import DetachExternalIpModal from './DetachExternalIpModal';

interface ClusterNetworkingDetailsTabProps {
  cluster: Cluster;
}

export const ClusterNetworkingDetailsTab = ({ cluster }: ClusterNetworkingDetailsTabProps) => {
  const [attachEndpoint, setAttachEndpoint] = useState<ExternalIPAttachmentEndpoint | undefined>();
  const [detachAttachment, setDetachAttachment] = useState<ExternalIPAttachment>();
  const detachEndpoint = detachAttachment?.spec?.targetEndpoint;

  return (
    <>
      <Stack hasGutter>
        <StackItem>
          <ClusterNetworkingCard cluster={cluster} />
        </StackItem>
        <StackItem>
          <ClusterExternalIpCard
            cluster={cluster}
            onAttach={setAttachEndpoint}
            onDetach={setDetachAttachment}
          />
        </StackItem>
      </Stack>
      {attachEndpoint !== undefined && (
        <AttachExternalIpModal
          clusterId={cluster.id}
          endpoint={attachEndpoint}
          onClose={() => setAttachEndpoint(undefined)}
          onSuccess={() => setAttachEndpoint(undefined)}
        />
      )}
      {detachAttachment &&
        (detachEndpoint === ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_API ||
          detachEndpoint ===
            ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_INGRESS) && (
          <DetachExternalIpModal
            attachment={detachAttachment}
            externalIpAddress={detachAttachment.status?.externalIpAddress}
            endpoint={detachEndpoint}
            onClose={() => setDetachAttachment(undefined)}
          />
        )}
    </>
  );
};
