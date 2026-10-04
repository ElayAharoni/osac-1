import { useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  PageSection,
  Stack,
  Title,
} from '@patternfly/react-core';

import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { VolumeWizard } from './VolumeWizard';

const VOLUMES_LIST_PATH = '/storage/volumes';

export const VolumeWizardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
            <BreadcrumbItem isActive>{t('Create volume')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Create volume')}
          </Title>
        </Stack>
      </PageSection>
      <VolumeWizard />
    </>
  );
};
