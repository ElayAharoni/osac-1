import { create } from '@bufbuild/protobuf';
import { Code, ConnectError } from '@connectrpc/connect';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ExternalIP, ExternalIPAttachmentsCreateRequest } from '@osac/types';
import {
  ExternalIPAttachmentEndpoint,
  ExternalIPAttachmentsCreateResponseSchema,
  ExternalIPState,
} from '@osac/types';

import AttachExternalIpModal from './AttachExternalIpModal';
import type { MockTransportOverrides } from '../../../test-utils/createMockConnectTransport';
import { renderWithProviders } from '../../../test-utils/TestProviders';
import { EXTERNAL_IP_PICKER_LIMIT } from '../../ExternalIp/AttachExternalIpModal';

const eligibleIp = {
  id: 'eip-1',
  metadata: { name: 'edge-ip' },
  status: {
    state: ExternalIPState.EXTERNAL_IP_STATE_ALLOCATED,
    attached: false,
    address: '203.0.113.10',
  },
} as ExternalIP;

const attachedIp = {
  id: 'eip-attached',
  metadata: { name: 'in-use-ip' },
  status: {
    state: ExternalIPState.EXTERNAL_IP_STATE_ALLOCATED,
    attached: true,
    address: '203.0.113.11',
  },
} as ExternalIP;

const renderModal = ({
  endpoint = ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_API,
  endpointOccupied = false,
  onClose = vi.fn(),
  onSuccess = vi.fn(),
  externalIps = [eligibleIp],
  transportOverrides,
}: {
  endpoint?: ExternalIPAttachmentEndpoint;
  endpointOccupied?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  externalIps?: ExternalIP[];
  transportOverrides?: MockTransportOverrides;
} = {}) =>
  renderWithProviders(
    <AttachExternalIpModal
      clusterId="cluster-1"
      endpoint={endpoint}
      endpointOccupied={endpointOccupied}
      onClose={onClose}
      onSuccess={onSuccess}
    />,
    { apiFixtures: { externalIps }, transportOverrides },
  );

describe('AttachExternalIpModal', () => {
  it('submits a cluster endpoint attachment without exposing a name field', async () => {
    const onSuccess = vi.fn();
    let createRequest: ExternalIPAttachmentsCreateRequest | undefined;
    const { user } = renderModal({
      endpoint: ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_INGRESS,
      onSuccess,
      transportOverrides: {
        onExternalIpAttachmentCreate: (request) => {
          createRequest = request;
          return create(ExternalIPAttachmentsCreateResponseSchema, {
            object: { id: 'attachment-1', spec: request.object?.spec },
          });
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/^External IP/)).toHaveTextContent('edge-ip');
    });
    expect(screen.queryByLabelText(/^Name/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Attach$/ }));

    await waitFor(() => {
      expect(createRequest?.object?.spec?.externalIp?.id).toBe('eip-1');
    });
    expect(createRequest?.object?.spec?.target.case).toBe('cluster');
    expect(createRequest?.object?.spec?.target.value?.id).toBe('cluster-1');
    expect(createRequest?.object?.spec?.targetEndpoint).toBe(
      ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_INGRESS,
    );
    expect(createRequest?.object?.metadata?.name).toMatch(/^eipa-/);
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('lists only allocated unattached external IPs', async () => {
    const { user } = renderModal({ externalIps: [eligibleIp, attachedIp] });

    await user.click(await screen.findByLabelText(/^External IP/));

    expect(screen.getByRole('option', { name: 'edge-ip' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'in-use-ip' })).not.toBeInTheDocument();
  });

  it('bounds the external IP list request', async () => {
    let requestedLimit: number | undefined;
    renderModal({
      transportOverrides: {
        onExternalIpList: (request) => {
          requestedLimit = request.limit;
        },
      },
    });

    await waitFor(() => expect(requestedLimit).toBe(EXTERNAL_IP_PICKER_LIMIT));
  });

  it('shows an empty state and disables attach when no IP is available', async () => {
    renderModal({ externalIps: [attachedIp] });

    expect(await screen.findByText('No unattached external IPs available')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Attach$/ })).toBeDisabled();
  });

  it('prevents submission when the endpoint is already occupied', () => {
    renderModal({ endpointOccupied: true });

    expect(
      screen.getByText('This endpoint already has an external IP attached.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Attach$/ })).toBeDisabled();
  });

  it('shows attach errors and keeps the modal open for retry', async () => {
    const onSuccess = vi.fn();
    const { user } = renderModal({
      onSuccess,
      transportOverrides: {
        onExternalIpAttachmentCreate: () => {
          throw new ConnectError('already attached', Code.AlreadyExists);
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/^External IP/)).toHaveTextContent('edge-ip');
    });
    await user.click(screen.getByRole('button', { name: /^Attach$/ }));

    expect(await screen.findByText('already attached')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Attach$/ })).toBeEnabled();
  });
});
