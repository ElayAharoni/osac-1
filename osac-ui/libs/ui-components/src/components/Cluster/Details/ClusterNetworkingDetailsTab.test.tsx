import { create } from '@bufbuild/protobuf';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ClusterSchema } from '@osac/types';

import { ClusterNetworkingDetailsTab } from './ClusterNetworkingDetailsTab';
import { renderWithProviders } from '../../../test-utils/TestProviders';

const cluster = create(ClusterSchema, {
  id: 'cluster-1',
});

describe('ClusterNetworkingDetailsTab', () => {
  it('renders the cluster networking card without the endpoint attachment card', () => {
    renderWithProviders(<ClusterNetworkingDetailsTab cluster={cluster} />);

    expect(screen.getByText('Networking')).toBeInTheDocument();
    expect(screen.queryByText('External IP endpoints')).not.toBeInTheDocument();
  });
});
