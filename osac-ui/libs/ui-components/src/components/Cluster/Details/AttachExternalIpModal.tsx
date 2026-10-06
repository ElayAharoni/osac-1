import { useRef } from 'react';
import { Alert, Button, Modal, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';
import { Formik } from 'formik';
import type { TFunction } from 'i18next';
import * as Yup from 'yup';

import { ExternalIPAttachmentEndpoint, ExternalIPs } from '@osac/types';

import { useCreateExternalIPAttachment } from '../../../api/v1/external-ip';
import { unallocatedExternalIpFilter } from '../../../api/v1/networking';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';
import OsacForm from '../../Form/OsacForm';
import {
  ResourceSelectField,
  type ResourceSelectValue,
  emptyResourceSelectValue,
} from '../../Form/ResourceSelectField';

export interface AttachExternalIpModalProps {
  clusterId: string;
  endpoint: ExternalIPAttachmentEndpoint;
  endpointOccupied?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  externalIp: ResourceSelectValue;
}

const generateExternalIpAttachmentName = (): string => `eipa-${crypto.randomUUID()}`;

const validationSchema = (t: TFunction) =>
  Yup.object({
    externalIp: Yup.object({
      id: Yup.string().required(t('An external IP is required')),
    }),
  });

const AttachExternalIpModal = ({
  clusterId,
  endpoint,
  endpointOccupied = false,
  onClose,
  onSuccess,
}: AttachExternalIpModalProps) => {
  const { t } = useTranslation();
  const submittingRef = useRef(false);
  const createAttachment = useCreateExternalIPAttachment();
  const title =
    endpoint === ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_API
      ? t('Attach external IP to API endpoint')
      : t('Attach external IP to Ingress endpoint');

  return (
    <Formik<FormValues>
      initialValues={{ externalIp: emptyResourceSelectValue() }}
      validationSchema={validationSchema(t)}
      onSubmit={async (values) => {
        if (submittingRef.current || endpointOccupied || !values.externalIp.id) {
          return;
        }
        submittingRef.current = true;
        try {
          await createAttachment.mutateAsync({
            metadata: { name: generateExternalIpAttachmentName() },
            spec: {
              externalIp: { id: values.externalIp.id },
              target: { case: 'cluster', value: { id: clusterId } },
              targetEndpoint: endpoint,
            },
          });
          onSuccess();
        } catch {
          // surfaced via createAttachment.error below
        } finally {
          submittingRef.current = false;
        }
      }}
    >
      {({ submitForm, isSubmitting, values }) => (
        <Modal
          variant="small"
          isOpen
          onClose={isSubmitting ? undefined : onClose}
          aria-labelledby="attach-external-ip-modal-title"
        >
          <ModalHeader title={title} labelId="attach-external-ip-modal-title" />
          <ModalBody>
            <OsacForm>
              <ResourceSelectField
                name="externalIp"
                label={t('External IP')}
                fieldId="attach-cluster-external-ip"
                service={ExternalIPs}
                request={{ filter: unallocatedExternalIpFilter() }}
                isRequired
                isDisabled={endpointOccupied}
                autoSelectSingleOption
                placeholder={t('Select an external IP')}
                loadErrorTitle={t('Error loading external IPs')}
                emptyTitle={t('No unattached external IPs available')}
                emptyDescription={t(
                  'Create an external IP first, then attach it to this cluster endpoint.',
                )}
              />
            </OsacForm>
            {endpointOccupied ? (
              <Alert
                variant="warning"
                title={t('This endpoint already has an external IP attached.')}
                isInline
              />
            ) : null}
            {createAttachment.error ? (
              <Alert variant="danger" title={t('Failed to attach external IP')} isInline>
                {getErrorMessage(createAttachment.error)}
              </Alert>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button variant="link" onClick={onClose} isDisabled={isSubmitting}>
              {t('Cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={submitForm}
              isDisabled={endpointOccupied || isSubmitting || !values.externalIp.id}
              isLoading={isSubmitting}
            >
              {t('Attach')}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </Formik>
  );
};

export default AttachExternalIpModal;
