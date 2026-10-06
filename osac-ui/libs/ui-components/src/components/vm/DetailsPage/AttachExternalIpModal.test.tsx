import { create } from '@bufbuild/protobuf';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstance, ExternalIP, ExternalIPAttachmentsCreateRequest } from '@osac/types';
import { ExternalIPAttachmentsCreateResponseSchema, ExternalIPState } from '@osac/types';

import AttachExternalIpModal from './AttachExternalIpModal';
import type { MockTransportOverrides } from '../../../test-utils/createMockConnectTransport';
import { renderWithProviders } from '../../../test-utils/TestProviders';

const vm = { id: 'vm-1', metadata: { name: 'test-vm' } } as ComputeInstance;

const eligibleIp = {
  id: 'eip-1',
  metadata: { name: 'edge-ip' },
  status: {
    state: ExternalIPState.EXTERNAL_IP_STATE_ALLOCATED,
    attached: false,
    address: '203.0.113.10',
  },
} as ExternalIP;

const renderModal = ({
  onClose = vi.fn(),
  onSuccess = vi.fn(),
  transportOverrides,
}: {
  onClose?: () => void;
  onSuccess?: () => void;
  transportOverrides?: MockTransportOverrides;
} = {}) =>
  renderWithProviders(<AttachExternalIpModal vm={vm} onClose={onClose} onSuccess={onSuccess} />, {
    apiFixtures: { externalIps: [eligibleIp] },
    transportOverrides,
  });

describe('AttachExternalIpModal', () => {
  it('submits an attachment for the auto-selected unattached IP', async () => {
    const onSuccess = vi.fn();
    let createRequest: ExternalIPAttachmentsCreateRequest | undefined;
    const { user } = renderModal({
      onSuccess,
      transportOverrides: {
        onExternalIpAttachmentCreate: (req) => {
          createRequest = req;
          return create(ExternalIPAttachmentsCreateResponseSchema, {
            object: { id: 'attachment-1', spec: req.object?.spec },
          });
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/^External IP/)).toHaveTextContent('edge-ip');
    });
    await user.click(screen.getByRole('button', { name: /^Attach$/ }));

    await waitFor(() => {
      expect(createRequest?.object?.spec?.externalIp?.id).toBe('eip-1');
    });
    expect(createRequest?.object?.metadata?.name).toMatch(
      /^eipa-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(createRequest?.object?.spec?.target.case).toBe('computeInstance');
    expect(createRequest?.object?.spec?.target.value?.id).toBe('vm-1');
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
