import { ExternalIPAttachmentEndpoint } from '@osac/types';

import {
  generateExternalIpAttachmentName,
  useCreateExternalIPAttachment,
} from '../../../api/v1/external-ip';
import { useTranslation } from '../../../hooks/useTranslation';
import ExternalIpAttachModal from '../../ExternalIp/AttachExternalIpModal';

export interface AttachExternalIpModalProps {
  clusterId: string;
  project: string;
  endpoint: ExternalIPAttachmentEndpoint;
  onClose: () => void;
}

const AttachExternalIpModal = ({
  clusterId,
  project,
  endpoint,
  onClose,
}: AttachExternalIpModalProps) => {
  const { t } = useTranslation();
  const createAttachment = useCreateExternalIPAttachment();
  const title =
    endpoint === ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_API
      ? t('Attach external IP to API endpoint')
      : t('Attach external IP to Ingress endpoint');

  return (
    <ExternalIpAttachModal
      title={title}
      emptyDescription={t('Create an external IP first, then attach it to this cluster endpoint.')}
      project={project}
      onAttach={(externalIpId) =>
        createAttachment.mutateAsync({
          object: {
            metadata: { name: generateExternalIpAttachmentName(), project },
            spec: {
              externalIp: { id: externalIpId },
              target: { case: 'cluster', value: { id: clusterId } },
              targetEndpoint: endpoint,
            },
          },
        })
      }
      onClose={onClose}
    />
  );
};

export default AttachExternalIpModal;
