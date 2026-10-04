import { Stack, StackItem, Title } from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';
import NameField from '../catalogProvision/wizard/fields/NameField';
import { InputField } from '../Form/InputField';
import OsacForm from '../Form/OsacForm';
import ProjectField from '../Form/ProjectField';

interface GeneralStepProps {
  isEdit: boolean;
}

export const GeneralStep = ({ isEdit }: GeneralStepProps) => {
  const { t } = useTranslation();

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          {t('General')}
        </Title>
      </StackItem>
      <StackItem>
        <OsacForm>
          <ProjectField isDisabled={isEdit} />
          <NameField isDisabled={isEdit} />
          <InputField
            name="metadata.description"
            label={t('Description')}
            fieldId="metadata-description"
            multiline
          />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
