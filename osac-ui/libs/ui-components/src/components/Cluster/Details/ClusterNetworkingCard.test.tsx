import { create } from '@bufbuild/protobuf';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ClusterSchema, ClusterState } from '@osac/types';

import ClusterNetworkingCard from './ClusterNetworkingCard';

describe('ClusterNetworkingCard', () => {
  it('displays the resolved subnet name', () => {
    const cluster = create(ClusterSchema, {
      id: 'cl-1',
      spec: {
        networkAttachment: {
          subnet: { id: 'subnet-1', name: 'my-subnet' },
          securityGroups: [],
        },
      },
    });

    render(<ClusterNetworkingCard cluster={cluster} />);

    expect(screen.getByText('my-subnet')).toBeInTheDocument();
  });

  it('displays a comma-separated list of security group names', () => {
    const cluster = create(ClusterSchema, {
      id: 'cl-2',
      spec: {
        networkAttachment: {
          subnet: { id: 'subnet-1', name: 'subnet-a' },
          securityGroups: [
            { id: 'sg-1', name: 'sg-alpha' },
            { id: 'sg-2', name: 'sg-beta' },
          ],
        },
      },
    });

    render(<ClusterNetworkingCard cluster={cluster} />);

    expect(screen.getByText('sg-alpha, sg-beta')).toBeInTheDocument();
  });

  it('shows a dash for empty networking fields', () => {
    const cluster = create(ClusterSchema, { id: 'cl-3' });

    render(<ClusterNetworkingCard cluster={cluster} />);

    expect(screen.getAllByText('—')).toHaveLength(4);
  });

  it('displays pod CIDR and service CIDR', () => {
    const cluster = create(ClusterSchema, {
      id: 'cl-cidr',
      spec: {
        network: {
          podCidr: '10.128.0.0/14',
          serviceCidr: '172.30.0.0/16',
        },
      },
    });

    render(<ClusterNetworkingCard cluster={cluster} />);

    expect(screen.getByText('10.128.0.0/14')).toBeInTheDocument();
    expect(screen.getByText('172.30.0.0/16')).toBeInTheDocument();
  });

  it('leaves API and Ingress endpoint presentation to the attachment card', () => {
    const cluster = create(ClusterSchema, {
      id: 'cl-endpoints',
      status: {
        state: ClusterState.READY,
        apiEndpoint: 'api.example.com',
        ingressEndpoint: 'apps.example.com',
      },
    });

    render(<ClusterNetworkingCard cluster={cluster} />);

    expect(screen.queryByText('api.example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('apps.example.com')).not.toBeInTheDocument();
  });
});
