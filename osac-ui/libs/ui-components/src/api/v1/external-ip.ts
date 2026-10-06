import type { MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import {
  ExternalIPAttachmentSchema,
  ExternalIPAttachments,
  type ExternalIPAttachmentsDeleteResponse,
  ExternalIPs,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../use-api-query';
import { useInvalidateServiceQueries } from '../use-resource';

type ExternalIPQueryOptions = {
  enabled?: boolean;
};

export const useExternalIPs = (params: ListParams = {}, options: ExternalIPQueryOptions = {}) => {
  const client = useApiFetch(ExternalIPs);
  return useApiQuery({
    queryKey: apiQueryKey('v1/external_ips', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled: options.enabled ?? true,
  });
};

export const useExternalIPAttachments = (
  params: ListParams = {},
  options: ExternalIPQueryOptions = {},
) => {
  const client = useApiFetch(ExternalIPAttachments);
  return useApiQuery({
    queryKey: apiQueryKey('v1/external_ip_attachments', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled: options.enabled ?? true,
  });
};

export const invalidateExternalIPAttachmentQueries = async (qc: ApiQueryClient) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/external_ip_attachments') });
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/external_ips') });
};

export const useCreateExternalIPAttachment = () => {
  const client = useApiFetch(ExternalIPAttachments);
  const qc = useApiQueryClient();
  const invalidateServiceQueries = useInvalidateServiceQueries();

  return useMutation({
    mutationFn: async (body: MessageInitShape<typeof ExternalIPAttachmentSchema>) => {
      const response = await client.create({ object: body });
      const attachment = response.object;
      if (!attachment?.id) {
        throw new Error('Create response missing external IP attachment');
      }
      return attachment;
    },
    onSuccess: async () => {
      await invalidateExternalIPAttachmentQueries(qc);
      await invalidateServiceQueries(ExternalIPAttachments);
      await invalidateServiceQueries(ExternalIPs);
    },
  });
};

export const useDeleteExternalIPAttachment = () => {
  const client = useApiFetch(ExternalIPAttachments);
  const qc = useApiQueryClient();
  const invalidateServiceQueries = useInvalidateServiceQueries();

  return useMutation<ExternalIPAttachmentsDeleteResponse, Error, string>({
    mutationFn: (id) => client.delete({ id }),
    onSuccess: async () => {
      await invalidateExternalIPAttachmentQueries(qc);
      await invalidateServiceQueries(ExternalIPAttachments);
      await invalidateServiceQueries(ExternalIPs);
    },
  });
};
