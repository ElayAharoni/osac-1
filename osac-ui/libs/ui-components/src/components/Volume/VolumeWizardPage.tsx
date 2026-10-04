import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Bullseye,
  Button,
  PageSection,
  Spinner,
  Stack,
  Title,
} from '@patternfly/react-core';

import { Volumes } from '@osac/types';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import { getErrorMessage } from '@osac/ui-components/utils/error';

import { VolumeWizard } from './VolumeWizard';
import { useGetResource } from '../../api/use-resource';

const VOLUMES_LIST_PATH = '/storage/volumes';

export const VolumeWizardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { data, isLoading, error } = useGetResource(Volumes, { id: id ?? '' }, { enabled: isEdit });

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" isInline title={t('Failed to fetch volume')}>
        {getErrorMessage(error)}
      </Alert>
    );
  }

  if (isEdit && !data?.object) {
    return <Alert variant="danger" isInline title={t('Volume not found')} />;
  }

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate(VOLUMES_LIST_PATH)}>
                {t('Volumes')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>
              {isEdit ? t('Edit volume') : t('Create volume')}
            </BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {isEdit ? t('Edit volume') : t('Create volume')}
          </Title>
        </Stack>
      </PageSection>
      <VolumeWizard volume={data?.object} />
    </>
  );
};
