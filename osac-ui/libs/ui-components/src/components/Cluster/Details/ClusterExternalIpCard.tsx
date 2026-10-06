import {
  Bullseye,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  Label,
  Spinner,
} from '@patternfly/react-core';

import {
  type Cluster,
  ClusterState,
  ExternalIPAttachmentEndpoint,
  ExternalIPAttachmentState,
} from '@osac/types';
import type { ExternalIPAttachment } from '@osac/types';

import { useExternalIPAttachments } from '../../../api/v1/external-ip';
import { clusterAttachmentFilter } from '../../../api/v1/external-ip-data';
import { useTranslation } from '../../../hooks/useTranslation';
import QueryErrorState from '../../Resource/QueryErrorState';

export interface ClusterEndpointAttachments {
  api: ExternalIPAttachment | undefined;
  ingress: ExternalIPAttachment | undefined;
}

export const groupAttachmentsByEndpoint = (
  attachments: readonly ExternalIPAttachment[],
): ClusterEndpointAttachments => {
  let api: ExternalIPAttachment | undefined;
  let ingress: ExternalIPAttachment | undefined;

  for (const attachment of attachments) {
    const endpoint = attachment.spec?.targetEndpoint;

    if (endpoint === ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_API) {
      api = attachment;
    } else if (endpoint === ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_INGRESS) {
      ingress = attachment;
    }
  }

  return { api, ingress };
};

export interface ClusterExternalIpCardProps {
  cluster: Cluster;
  onAttach?: (endpoint: ExternalIPAttachmentEndpoint) => void;
  onDetach?: (attachment: ExternalIPAttachment) => void;
}

const isTerminalFailedState = (state: ClusterState | undefined): boolean =>
  state === ClusterState.FAILED || state === ClusterState.DELETE_FAILED;

const attachmentStateLabel = (
  state: ExternalIPAttachmentState | undefined,
  t: (key: string) => string,
): string => {
  switch (state) {
    case ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_PENDING:
      return t('Attaching');
    case ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_FAILED:
      return t('Failed');
    case ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_READY:
      return t('Attached');
    case ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_DELETING:
      return t('Detaching');
    default:
      return t('External IP attachment pending');
  }
};

const isAttachmentBusyState = (state: ExternalIPAttachmentState | undefined): boolean =>
  state === undefined ||
  state === ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_UNSPECIFIED ||
  state === ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_PENDING ||
  state === ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_DELETING;

interface EndpointRowProps {
  autoAttachmentRequested: boolean;
  cluster: Cluster;
  endpoint: ExternalIPAttachmentEndpoint;
  attachment: ExternalIPAttachment | undefined;
  onAttach?: (endpoint: ExternalIPAttachmentEndpoint) => void;
  onDetach?: (attachment: ExternalIPAttachment) => void;
}

const EndpointRow = ({
  autoAttachmentRequested,
  cluster,
  endpoint,
  attachment,
  onAttach,
  onDetach,
}: EndpointRowProps) => {
  const { t } = useTranslation();
  const clusterState = cluster.status?.state;
  const endpointValue =
    endpoint === ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_API
      ? cluster.status?.apiEndpoint
      : cluster.status?.ingressEndpoint;
  const endpointText = endpointValue?.trim()
    ? endpointValue.trim()
    : isTerminalFailedState(clusterState)
      ? '—'
      : clusterState === ClusterState.PROGRESSING
        ? t('Awaiting provisioning')
        : '—';
  const label =
    endpoint === ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_API
      ? t('API endpoint')
      : t('Ingress endpoint');
  const detachAriaLabel =
    endpoint === ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_API
      ? t('Detach External IP from API endpoint')
      : t('Detach External IP from Ingress endpoint');
  const attachmentState = attachment?.status?.state;
  const isReady = attachmentState === ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_READY;
  const isAttachmentInProgress = attachment !== undefined && isAttachmentBusyState(attachmentState);
  const isAutoAttachmentInProgress =
    autoAttachmentRequested &&
    (attachment === undefined ||
      isAttachmentBusyState(attachmentState) ||
      attachmentState === ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_FAILED);
  const isActionDisabled = isAttachmentInProgress || isAutoAttachmentInProgress;
  const autoAttachmentLabel = isReady ? t('Auto attached') : t('Auto attaching in progress');
  const attachmentContent =
    attachment === undefined ? null : isReady ? (
      !autoAttachmentRequested && (
        <Label color="green" isCompact>
          {t('Attached')}
        </Label>
      )
    ) : !autoAttachmentRequested ? (
      <Content component="p">
        <Label
          color={
            attachmentState === ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_FAILED
              ? 'red'
              : 'orange'
          }
        >
          {attachmentStateLabel(attachmentState, t)}
        </Label>
        {attachment.status?.message ? ` ${attachment.status.message}` : null}
      </Content>
    ) : attachment.status?.message ? (
      <Content component="p">{attachment.status.message}</Content>
    ) : null;
  const actionButton = attachment ? (
    <Button
      variant="link"
      isInline
      aria-label={detachAriaLabel}
      isDisabled={isActionDisabled}
      onClick={() => onDetach?.(attachment)}
    >
      {t('Detach')}
    </Button>
  ) : (
    <Button
      variant="link"
      isInline
      aria-label={t('Attach External IP')}
      isDisabled={isActionDisabled}
      onClick={() => onAttach?.(endpoint)}
    >
      {t('Attach External IP')}
    </Button>
  );

  return (
    <DescriptionListGroup>
      <DescriptionListTerm>{label}</DescriptionListTerm>
      <DescriptionListDescription>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              spaceItems={{ default: 'spaceItemsSm' }}
            >
              <FlexItem>{endpointText}</FlexItem>
              {autoAttachmentRequested && (
                <FlexItem>
                  <Label color="blue" isCompact>
                    {autoAttachmentLabel}
                  </Label>
                </FlexItem>
              )}
              {attachmentContent && <FlexItem>{attachmentContent}</FlexItem>}
            </Flex>
          </FlexItem>
          <FlexItem>{actionButton}</FlexItem>
        </Flex>
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

const ClusterExternalIpCard = ({ cluster, onAttach, onDetach }: ClusterExternalIpCardProps) => {
  const { t } = useTranslation();
  const {
    data: attachments = [],
    isLoading,
    error,
  } = useExternalIPAttachments(
    { filter: clusterAttachmentFilter(cluster.id) },
    { enabled: Boolean(cluster.id) },
  );
  const grouped = groupAttachmentsByEndpoint(attachments);
  const autoAttachmentRequested = cluster.spec?.autoExternalIpAttachment === true;

  return (
    <Card variant="secondary">
      <CardHeader>
        <CardTitle>{t('External IP endpoints')}</CardTitle>
      </CardHeader>
      <Divider />
      <CardBody>
        {isLoading ? (
          <Bullseye>
            <Spinner aria-label={t('Loading external IP attachments')} />
          </Bullseye>
        ) : error ? (
          <QueryErrorState error={error} title={t('Failed to load external IP attachments')} />
        ) : (
          <DescriptionList isCompact aria-label={t('External IP endpoints')}>
            <EndpointRow
              autoAttachmentRequested={autoAttachmentRequested}
              cluster={cluster}
              endpoint={ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_API}
              attachment={grouped.api}
              onAttach={onAttach}
              onDetach={onDetach}
            />
            <EndpointRow
              autoAttachmentRequested={autoAttachmentRequested}
              cluster={cluster}
              endpoint={ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_INGRESS}
              attachment={grouped.ingress}
              onAttach={onAttach}
              onDetach={onDetach}
            />
          </DescriptionList>
        )}
      </CardBody>
    </Card>
  );
};

export default ClusterExternalIpCard;
