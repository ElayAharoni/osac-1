import { create } from '@bufbuild/protobuf';
import { describe, expect, it } from 'vitest';

import { VolumeAccessMode, VolumeSchema } from '@osac/types';

import { buildVolumeCreatePayload, buildVolumeUpdatePayload } from './payload';
import type { VolumeFormValues } from './values';

const values: VolumeFormValues = {
  metadata: {
    project: 'project-a',
    name: 'data-volume',
    description: 'A block volume',
  },
  spec: {
    storageTier: { id: 'gold-block', name: 'gold-block' },
    sizeGib: '128',
    accessMode: VolumeAccessMode.READ_WRITE_ONCE,
  },
};

describe('buildVolumeCreatePayload', () => {
  it('maps form values to the Volume create object', () => {
    expect(buildVolumeCreatePayload(values)).toEqual({
      metadata: {
        project: 'project-a',
        name: 'data-volume',
        description: 'A block volume',
      },
      spec: {
        storageTier: 'gold-block',
        sizeGib: 128n,
        accessMode: VolumeAccessMode.READ_WRITE_ONCE,
      },
    });
  });
});

describe('buildVolumeUpdatePayload', () => {
  it('includes the volume identity and editable description only', () => {
    const volume = create(VolumeSchema, {
      id: 'volume-1',
      metadata: {
        project: 'project-a',
        name: 'data-volume',
      },
      spec: {
        storageTier: 'gold-block',
        sizeGib: 128n,
        accessMode: VolumeAccessMode.READ_WRITE_ONCE,
      },
    });

    expect(
      buildVolumeUpdatePayload(
        { ...values, metadata: { ...values.metadata, description: 'Updated' } },
        volume,
      ),
    ).toEqual({
      id: 'volume-1',
      metadata: {
        description: 'Updated',
      },
    });
  });
});
