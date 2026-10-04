import { create } from '@bufbuild/protobuf';
import { screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
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
} from '@osac/types';

import { VolumeWizard } from './VolumeWizard';
import { renderWithProviders } from '../../test-utils/TestProviders';

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  proceed: vi.fn(),
  reset: vi.fn(),
  blockerState: 'unblocked' as 'unblocked' | 'blocked',
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => routerMocks.navigate,
    useBlocker: () => ({
      state: routerMocks.blockerState,
      proceed: routerMocks.proceed,
      reset: routerMocks.reset,
    }),
  };
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

const volume = create(VolumeSchema, {
  id: 'volume-1',
  metadata: { project: '', name: 'existing-volume', description: 'Keep this volume' },
  spec: {
    storageTier: 'block-tier',
    sizeGib: 128n,
    accessMode: VolumeAccessMode.READ_WRITE_ONCE,
  },
  status: { state: VolumeState.AVAILABLE },
});

const renderWizard = (existingVolume?: typeof volume) =>
  renderWithProviders(<VolumeWizard volume={existingVolume} />, {
    apiFixtures: { projects: [project], publicStorageTiers: [storageTier] },
  });

const clickNext = async (user: UserEvent) => {
  await user.click(screen.getByRole('button', { name: 'Next' }));
};

const selectDefaultProject = async (user: UserEvent) => {
  const projectToggle = screen.getByRole('button', {
    name: (_name, element) => element.id === 'metadata.project',
  });
  await waitFor(() => expect(projectToggle).toBeEnabled());
  await user.click(projectToggle);
  await user.click(screen.getByRole('option', { name: 'Default' }));
};

const fillGeneralStep = async (user: UserEvent) => {
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'new-volume');
  await selectDefaultProject(user);
};

const selectConfigurationValues = async (user: UserEvent) => {
  const tierToggle = await screen.findByLabelText(/^Storage tier/);
  await user.click(tierToggle);
  await user.click(screen.getByRole('option', { name: 'block-tier' }));
  await user.type(screen.getByRole('spinbutton', { name: 'Size (GiB)' }), '64');
  await user.click(screen.getByRole('button', { name: 'Access Mode' }));
  await user.click(screen.getByRole('option', { name: 'ReadWriteOnce' }));
};

describe('VolumeWizard', () => {
  beforeEach(() => {
    routerMocks.navigate.mockReset();
    routerMocks.proceed.mockReset();
    routerMocks.reset.mockReset();
    routerMocks.blockerState = 'unblocked';
  });

  it('renders the three create steps with editable general fields', async () => {
    renderWizard();

    expect(await screen.findByRole('button', { name: 'General' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configuration' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'General' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeEnabled();
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeEnabled();
    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: (_name, element) => element.id === 'metadata.project',
        }),
      ).toBeEnabled();
    });
  });

  it('shows validation errors and stays on General when required fields are empty', async () => {
    const { user } = renderWizard();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'General' })).toBeInTheDocument();
  });

  it('advances through Configuration to Review after valid input', async () => {
    const { user } = renderWizard();

    await fillGeneralStep(user);
    await clickNext(user);
    expect(await screen.findByRole('heading', { name: 'Configuration' })).toBeInTheDocument();

    await selectConfigurationValues(user);
    await clickNext(user);

    expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument();
    expect(screen.getByText('new-volume')).toBeInTheDocument();
    expect(screen.getByText('block-tier')).toBeInTheDocument();
    expect(screen.getByText('64 GiB')).toBeInTheDocument();
    expect(screen.getByText('ReadWriteOnce')).toBeInTheDocument();
  });

  it('prepopulates edit mode and disables immutable fields while allowing description edits', async () => {
    const { user } = renderWizard(volume);

    expect(await screen.findByDisplayValue('existing-volume')).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('Keep this volume');
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeEnabled();
    expect(
      screen.getByRole('button', {
        name: (_name, element) => element.id === 'metadata.project',
      }),
    ).toBeDisabled();

    await clickNext(user);

    expect(await screen.findByRole('heading', { name: 'Configuration' })).toBeInTheDocument();
    expect(await screen.findByLabelText(/^Storage tier/)).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'Size (GiB)' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Access Mode' })).toBeDisabled();

    await clickNext(user);
    expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('shows the leave-form confirmation when navigation is blocked', async () => {
    routerMocks.blockerState = 'blocked';
    renderWizard();

    expect(await screen.findByText('Discard unsaved changes?')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Keep editing' }).click();
    expect(routerMocks.reset).toHaveBeenCalledOnce();
    screen.getByRole('button', { name: 'Discard and close' }).click();
    expect(routerMocks.proceed).toHaveBeenCalledOnce();
  });
});
