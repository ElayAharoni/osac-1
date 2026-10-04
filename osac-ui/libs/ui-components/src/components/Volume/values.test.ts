import { create } from '@bufbuild/protobuf';
import { describe, expect, it } from 'vitest';

import { VolumeAccessMode, VolumeSchema } from '@osac/types';

import { getVolumeValues } from './values';
import { emptyResourceSelectValue } from '../Form/resourceSelectValue';

describe('getVolumeValues', () => {
  it('returns empty create values', () => {
    expect(getVolumeValues()).toEqual({
      metadata: {
        project: '',
        name: '',
        description: '',
      },
      spec: {
        storageTier: emptyResourceSelectValue(),
        sizeGib: '',
        accessMode: VolumeAccessMode.UNSPECIFIED,
      },
    });
  });

  it('normalizes an existing volume for edit mode', () => {
    const volume = create(VolumeSchema, {
      id: 'volume-1',
      metadata: {
        project: 'project-a',
        name: 'data-volume',
        description: 'Existing description',
      },
      spec: {
        storageTier: 'gold-block',
        sizeGib: 128n,
        accessMode: VolumeAccessMode.READ_WRITE_ONCE,
      },
    });

    expect(getVolumeValues(volume)).toEqual({
      metadata: {
        project: 'project-a',
        name: 'data-volume',
        description: 'Existing description',
      },
      spec: {
        storageTier: { id: 'gold-block', name: 'gold-block' },
        sizeGib: '128',
        accessMode: VolumeAccessMode.READ_WRITE_ONCE,
      },
    });
  });

  it('uses empty values for fields missing from a partial volume', () => {
    const volume = create(VolumeSchema, { id: 'volume-1' });

    expect(getVolumeValues(volume)).toEqual({
      metadata: {
        project: '',
        name: '',
        description: '',
      },
      spec: {
        storageTier: emptyResourceSelectValue(),
        sizeGib: '',
        accessMode: VolumeAccessMode.UNSPECIFIED,
      },
    });
  });
});
