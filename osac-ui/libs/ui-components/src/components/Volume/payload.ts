import type { MessageInitShape } from '@bufbuild/protobuf';

import { VolumeSchema } from '@osac/types';

import type { VolumeFormValues } from './values';

export const buildVolumeCreatePayload = (
  values: VolumeFormValues,
): MessageInitShape<typeof VolumeSchema> => {
  const sizeGib = values.spec.sizeGib;
  if (sizeGib === undefined) {
    throw new Error('Volume size is required');
  }

  return {
    metadata: {
      name: values.metadata.name,
      description: values.metadata.description,
    },
    spec: {
      storageTier: values.spec.storageTier.name,
      sizeGib: BigInt(sizeGib),
      accessMode: values.spec.accessMode,
    },
  };
};
