import type { MessageInitShape } from '@bufbuild/protobuf';

import { type Volume, VolumeSchema } from '@osac/types';

import type { VolumeFormValues } from './values';

export const buildVolumeCreatePayload = (
  values: VolumeFormValues,
): MessageInitShape<typeof VolumeSchema> => ({
  metadata: {
    name: values.metadata.name,
    project: values.metadata.project,
    description: values.metadata.description,
  },
  spec: {
    storageTier: values.spec.storageTier.name,
    sizeGib: BigInt(values.spec.sizeGib),
    accessMode: values.spec.accessMode,
  },
});

export const buildVolumeUpdatePayload = (
  values: VolumeFormValues,
  volume: Volume,
): MessageInitShape<typeof VolumeSchema> => ({
  id: volume.id,
  metadata: {
    description: values.metadata.description,
  },
});
