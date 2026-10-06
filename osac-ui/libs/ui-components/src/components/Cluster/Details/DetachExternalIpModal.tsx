import { ExternalIPAttachmentEndpoint } from '@osac/types';
import type { ExternalIPAttachment } from '@osac/types';

import { useDeleteExternalIPAttachment } from '../../../api/v1/external-ip';
import { useTranslation } from '../../../hooks/useTranslation';
import DeleteResourceModal from '../../Resource/DeleteResourceModal';

export interface DetachExternalIpModalProps {
  attachment: ExternalIPAttachment;
  externalIpAddress?: string;
  endpoint: ExternalIPAttachmentEndpoint;
  onClose: () => void;
}

const DetachExternalIpModal = ({
  attachment,
  externalIpAddress,
  endpoint,
  onClose,
}: DetachExternalIpModalProps) => {
  const { t } = useTranslation();
  const deleteAttachment = useDeleteExternalIPAttachment();
  const resourceName = externalIpAddress || attachment.spec?.externalIp?.id || attachment.id;
  const label =
    endpoint === ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_API
      ? t('This detaches the external IP from the API endpoint.')
      : t('This detaches the external IP from the Ingress endpoint.');

  return (
    <DeleteResourceModal
      resourceName={resourceName}
      label={label}
      errorLabel={t('Failed to detach external IP')}
      onClose={onClose}
      onSuccess={onClose}
      mutation={deleteAttachment}
      variables={attachment.id}
    />
  );
};

export default DetachExternalIpModal;
