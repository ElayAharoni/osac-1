import type { ReactNode } from 'react';

import { ExternalIPAttachments, ExternalIPs } from '@osac/types';
import type { ExternalIPAttachment } from '@osac/types';

import { apiQueryKey } from '../../api/types';
import { useApiQueryClient } from '../../api/use-api-query';
import { useDeleteResource, useInvalidateServiceQueries } from '../../api/use-resource';
import { useTranslation } from '../../hooks/useTranslation';
import DeleteResourceModal from '../Resource/DeleteResourceModal';

export interface ExternalIpDetachModalProps {
  attachment: ExternalIPAttachment;
  label: ReactNode;
  onClose: () => void;
}

const ExternalIpDetachModal = ({ attachment, label, onClose }: ExternalIpDetachModalProps) => {
  const { t } = useTranslation();
  const queryClient = useApiQueryClient();
  const invalidateService = useInvalidateServiceQueries();
  const deleteAttachment = useDeleteResource(ExternalIPAttachments, {
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: apiQueryKey('v1/external_ip_attachments') }),
        invalidateService(ExternalIPs),
      ]);
    },
  });
  const resourceName =
    attachment.status?.externalIpAddress || attachment.spec?.externalIp?.id || attachment.id;

  return (
    <DeleteResourceModal
      resourceName={resourceName}
      label={label}
      errorLabel={t('Failed to detach external IP')}
      onClose={onClose}
      onSuccess={onClose}
      mutation={deleteAttachment}
      variables={{ id: attachment.id }}
    />
  );
};

export default ExternalIpDetachModal;
