import { type Volume, VolumeAccessMode } from '@osac/types';

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

export const getVolumeValues = (volume?: Volume): VolumeFormValues => ({
  metadata: {
    project: volume?.metadata?.project ?? '',
    name: volume?.metadata?.name ?? '',
    description: volume?.metadata?.description ?? '',
  },
  spec: {
    storageTier: volume?.spec?.storageTier
      ? { id: volume.spec.storageTier, name: volume.spec.storageTier }
      : emptyResourceSelectValue(),
    sizeGib: volume?.spec ? volume.spec.sizeGib.toString() : '',
    accessMode: volume?.spec?.accessMode ?? VolumeAccessMode.UNSPECIFIED,
  },
});
