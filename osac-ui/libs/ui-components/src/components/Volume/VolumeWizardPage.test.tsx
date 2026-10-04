import { Route, Routes, useLocation, useParams } from 'react-router-dom';
import { create } from '@bufbuild/protobuf';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ProjectSchema,
  ProjectState,
  StorageProtocol,
  StorageTierSchema,
  StorageTierState,
  VolumeAccessMode,
  VolumeSchema,
  VolumeState,
  Volumes,
  type VolumesCreateRequest,
  VolumesCreateResponseSchema,
  type VolumesGetResponse,
  VolumesGetResponseSchema,
  type VolumesUpdateRequest,
  VolumesUpdateResponseSchema,
} from '@osac/types';
import { mockQueryResult } from '@osac/ui-components/test-utils/query';

import { VolumeWizardPage } from './VolumeWizardPage';
import { useGetResource } from '../../api/use-resource';
import type { RenderWithProvidersOptions } from '../../test-utils/TestProviders';
import { renderWithProviders } from '../../test-utils/TestProviders';

vi.mock('../../api/use-resource', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/use-resource')>();
  return { ...actual, useGetResource: vi.fn() };
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useBlocker: () => ({ state: 'unblocked' as const }) };
});

const volume = create(VolumeSchema, {
  id: 'volume-1',
  metadata: { project: '', name: 'existing-volume', description: 'Existing volume' },
  spec: {
    storageTier: 'block-tier',
    sizeGib: 128n,
    accessMode: VolumeAccessMode.READ_WRITE_ONCE,
  },
  status: { state: VolumeState.AVAILABLE },
});

const project = create(ProjectSchema, {
  id: 'project-1',
  metadata: { name: '' },
  spec: { title: 'Default' },
  status: { state: ProjectState.ACTIVE },
});

const storageTier = create(StorageTierSchema, {
  id: 'tier-block',
  metadata: { name: 'block-tier' },
  spec: { description: 'Block storage', protocol: StorageProtocol.BLOCK },
  status: { state: StorageTierState.ACTIVE },
});

const VolumeDetailProbe = () => {
  const { id } = useParams();
  return <div>Volume detail: {id}</div>;
};

const NavigationProbe = () => {
  const location = useLocation();
  return <div>Current path: {location.pathname}</div>;
};

const renderAt = (path: string, options: Omit<RenderWithProvidersOptions, 'routerEntries'> = {}) =>
  renderWithProviders(
    <Routes>
      <Route path="/storage/volumes/create" element={<VolumeWizardPage />} />
      <Route path="/storage/volumes/:id/edit" element={<VolumeWizardPage />} />
      <Route path="/storage/volumes/:id" element={<VolumeDetailProbe />} />
      <Route path="*" element={<NavigationProbe />} />
    </Routes>,
    { ...options, routerEntries: [path] },
  );

const fillValidWizard = async (user: ReturnType<typeof renderWithProviders>['user']) => {
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'new-volume');
  const projectToggle = screen.getByRole('button', {
    name: (_name, element) => element.id === 'metadata.project',
  });
  await waitFor(() => expect(projectToggle).toBeEnabled());
  await user.click(projectToggle);
  await user.click(screen.getByRole('option', { name: 'Default' }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  expect(await screen.findByRole('heading', { name: 'Configuration' })).toBeInTheDocument();

  const tierToggle = await screen.findByLabelText(/^Storage tier/);
  await user.click(tierToggle);
  await user.click(screen.getByRole('option', { name: 'block-tier' }));
  await user.type(screen.getByRole('spinbutton', { name: 'Size (GiB)' }), '64');
  await user.click(screen.getByRole('button', { name: 'Access Mode' }));
  await user.click(screen.getByRole('option', { name: 'ReadWriteOnce' }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument();
};

describe('VolumeWizardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGetResource).mockReturnValue(
      mockQueryResult<VolumesGetResponse>({ data: undefined, isLoading: false, error: null }),
    );
  });

  it('renders the create page and wizard without loading a volume', async () => {
    renderAt('/storage/volumes/create');

    expect(await screen.findByRole('heading', { name: 'Create volume' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Volume wizard' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'General' })).toBeInTheDocument();
    await waitFor(() => {
      expect(vi.mocked(useGetResource)).toHaveBeenCalledWith(
        Volumes,
        { id: '' },
        { enabled: false },
      );
    });
  });

  it('shows a loading state while fetching an edit volume', () => {
    vi.mocked(useGetResource).mockReturnValue(
      mockQueryResult<VolumesGetResponse>({ data: undefined, isLoading: true, error: null }),
    );

    renderAt('/storage/volumes/volume-1/edit');

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Volume wizard' })).not.toBeInTheDocument();
  });

  it('passes the fetched volume to the edit wizard', async () => {
    vi.mocked(useGetResource).mockReturnValue(
      mockQueryResult<VolumesGetResponse>({
        data: create(VolumesGetResponseSchema, { object: volume }),
        isLoading: false,
        error: null,
      }),
    );

    renderAt('/storage/volumes/volume-1/edit');

    expect(await screen.findByRole('heading', { name: 'Edit volume' })).toBeInTheDocument();
    expect(await screen.findByDisplayValue('existing-volume')).toBeDisabled();
    expect(screen.getByRole('region', { name: 'Volume wizard' })).toBeInTheDocument();
    expect(vi.mocked(useGetResource)).toHaveBeenCalledWith(
      Volumes,
      { id: 'volume-1' },
      { enabled: true },
    );
  });

  it('shows an error when the edit volume cannot be fetched', () => {
    vi.mocked(useGetResource).mockReturnValue(
      mockQueryResult<VolumesGetResponse>({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      }),
    );

    renderAt('/storage/volumes/volume-1/edit');

    expect(screen.getByText('Failed to fetch volume')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Volume wizard' })).not.toBeInTheDocument();
  });

  it('creates a volume and navigates to its detail route', async () => {
    let capturedRequest: VolumesCreateRequest | undefined;
    const { user } = renderAt('/storage/volumes/create', {
      apiFixtures: { projects: [project], publicStorageTiers: [storageTier] },
      transportOverrides: {
        onVolumeCreate: (request) => {
          capturedRequest = request;
          return create(VolumesCreateResponseSchema, {
            object: {
              id: 'created-volume',
              metadata: request.object?.metadata,
              spec: request.object?.spec,
            },
          });
        },
      },
    });

    await fillValidWizard(user);
    await user.click(screen.getByRole('button', { name: 'Create volume' }));

    expect(await screen.findByText('Volume detail: created-volume')).toBeInTheDocument();
    expect(capturedRequest?.object).toMatchObject({
      metadata: { name: 'new-volume', project: '' },
      spec: {
        storageTier: 'block-tier',
        sizeGib: 64n,
        accessMode: VolumeAccessMode.READ_WRITE_ONCE,
      },
    });
  });

  it('updates only the editable description and sends an automatic update mask', async () => {
    let capturedRequest: VolumesUpdateRequest | undefined;
    vi.mocked(useGetResource).mockReturnValue(
      mockQueryResult<VolumesGetResponse>({
        data: create(VolumesGetResponseSchema, { object: volume }),
        isLoading: false,
        error: null,
      }),
    );
    const { user } = renderAt('/storage/volumes/volume-1/edit', {
      apiFixtures: { projects: [project], publicStorageTiers: [storageTier] },
      transportOverrides: {
        onVolumeUpdate: (request) => {
          capturedRequest = request;
          return create(VolumesUpdateResponseSchema, { object: request.object });
        },
      },
    });

    await screen.findByDisplayValue('existing-volume');
    const description = screen.getByRole('textbox', { name: 'Description' });
    await user.clear(description);
    await user.type(description, 'Updated description');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Configuration' });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Review' });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Volume detail: volume-1')).toBeInTheDocument();
    expect(capturedRequest?.object).toMatchObject({
      id: 'volume-1',
      metadata: { description: 'Updated description' },
    });
    expect(capturedRequest?.updateMask?.paths).toEqual(['id', 'metadata.description']);
  });
});
