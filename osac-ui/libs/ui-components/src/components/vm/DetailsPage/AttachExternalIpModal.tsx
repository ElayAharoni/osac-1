import type { ComputeInstance } from '@osac/types';

import {
  generateExternalIpAttachmentName,
  useCreateExternalIPAttachment,
} from '../../../api/v1/external-ip';
import { useTranslation } from '../../../hooks/useTranslation';
import ExternalIpAttachModal from '../../ExternalIp/AttachExternalIpModal';

interface AttachExternalIpModalProps {
  vm: ComputeInstance;
  onClose: () => void;
  onSuccess: () => void;
}

const AttachExternalIpModal = ({ vm, onClose, onSuccess }: AttachExternalIpModalProps) => {
  const { t } = useTranslation();
  const createAttachment = useCreateExternalIPAttachment();

  return (
    <ExternalIpAttachModal
      title={t('Attach external IP')}
      emptyDescription={t('Create an external IP first, then attach it to this virtual machine.')}
      onAttach={(externalIpId) =>
        createAttachment.mutateAsync({
          object: {
            metadata: { name: generateExternalIpAttachmentName() },
            spec: {
              externalIp: { id: externalIpId },
              target: { case: 'computeInstance', value: { id: vm.id } },
            },
          },
        })
      }
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

export default AttachExternalIpModal;
