import type { ExternalIPAttachment } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';
import ExternalIpDetachModal from '../../ExternalIp/DetachExternalIpModal';

interface DetachExternalIpModalProps {
  attachment: ExternalIPAttachment;
  externalIpAddress?: string;
  onClose: () => void;
}

const DetachExternalIpModal = ({
  attachment,
  externalIpAddress,
  onClose,
}: DetachExternalIpModalProps) => {
  const { t } = useTranslation();

  return (
    <ExternalIpDetachModal
      attachment={attachment}
      externalIpAddress={externalIpAddress}
      label={t('This detaches the external IP from the virtual machine.')}
      onClose={onClose}
    />
  );
};

export default DetachExternalIpModal;
