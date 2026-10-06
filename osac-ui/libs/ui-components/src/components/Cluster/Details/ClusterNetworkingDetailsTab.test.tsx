import { create } from '@bufbuild/protobuf';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ClusterSchema,
  ClusterState,
  ExternalIPAttachmentEndpoint,
  ExternalIPAttachmentState,
  ExternalIPState,
} from '@osac/types';
import type { ExternalIP, ExternalIPAttachment } from '@osac/types';

import { ClusterNetworkingDetailsTab } from './ClusterNetworkingDetailsTab';
import { renderWithProviders } from '../../../test-utils/TestProviders';

const cluster = create(ClusterSchema, {
  id: 'cluster-1',
  status: {
    state: ClusterState.READY,
    apiEndpoint: 'api.example.com',
    ingressEndpoint: 'apps.example.com',
  },
});

const externalIp = {
  id: 'eip-1',
  metadata: { name: 'edge-ip' },
  status: {
    state: ExternalIPState.EXTERNAL_IP_STATE_ALLOCATED,
    attached: false,
    address: '203.0.113.10',
  },
} as ExternalIP;

const attachment = {
  id: 'attachment-1',
  spec: {
    externalIp: { id: 'eip-1' },
    target: { case: 'cluster', value: { id: 'cluster-1' } },
    targetEndpoint: ExternalIPAttachmentEndpoint.EXTERNAL_IP_ATTACHMENT_ENDPOINT_API,
  },
  status: {
    state: ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_READY,
    externalIpAddress: '203.0.113.10',
  },
} as unknown as ExternalIPAttachment;

describe('ClusterNetworkingDetailsTab', () => {
  it('opens the endpoint attach modal from the API row', async () => {
    const { user } = renderWithProviders(<ClusterNetworkingDetailsTab cluster={cluster} />, {
      apiFixtures: { externalIps: [externalIp], externalIpAttachments: [] },
    });

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Attach External IP' })).toHaveLength(2);
    });
    await user.click(screen.getAllByRole('button', { name: 'Attach External IP' })[0]);

    expect(
      screen.getByRole('heading', { name: 'Attach external IP to API endpoint' }),
    ).toBeInTheDocument();
  });

  it('opens the endpoint detach confirmation modal for an existing attachment', async () => {
    const { user } = renderWithProviders(<ClusterNetworkingDetailsTab cluster={cluster} />, {
      apiFixtures: { externalIpAttachments: [attachment] },
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Detach External IP from API endpoint' }),
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Detach External IP from API endpoint' }));

    expect(screen.getByRole('heading', { name: /Delete 203\.0\.113\.10\?/ })).toBeInTheDocument();
  });
});
