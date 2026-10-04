import { VolumeAccessMode } from '@osac/types';

import { type ResourceSelectValue, emptyResourceSelectValue } from '../Form/ResourceSelectField';

export interface VolumeFormValues {
  metadata: {
    project: string;
    name: string;
    description: string;
  };
  spec: {
    storageTier: ResourceSelectValue;
    sizeGib: string;
    accessMode: VolumeAccessMode;
  };
}

export const getVolumeValues = (): VolumeFormValues => ({
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
