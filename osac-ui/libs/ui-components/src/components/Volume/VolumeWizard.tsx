import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageSection, PageSectionTypes, Wizard, WizardStep } from '@patternfly/react-core';
import { Formik } from 'formik';

import { type Volume, Volumes } from '@osac/types';

import { ConfigurationStep } from './ConfigurationStep';
import { GeneralStep } from './GeneralStep';
import { buildVolumeCreatePayload, buildVolumeUpdatePayload } from './payload';
import { ReviewStep } from './ReviewStep';
import { getVolumeValidationSchema, volumeStepHasErrors } from './validation';
import { type VolumeFormValues, getVolumeValues } from './values';
import { useCreateResource, useUpdateResource } from '../../api/use-resource';
import { useTranslation } from '../../hooks/useTranslation';
import { FieldValidationProvider } from '../Form/FieldValidationContext';
import LeaveFormConfirmation from '../Form/LeaveFormConfirmation';
import { OSACWizardFooter } from '../Wizard/OSACWizardFooter';

type VolumeWizardStep = 'general' | 'configuration' | 'review';

export interface VolumeWizardProps {
  volume?: Volume;
}

export const VolumeWizard = ({ volume }: VolumeWizardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<VolumeWizardStep>('general');
  const {
    mutateAsync: createVolume,
    error: createError,
    reset: resetCreate,
  } = useCreateResource(Volumes);
  const {
    mutateAsync: updateVolume,
    error: updateError,
    reset: resetUpdate,
  } = useUpdateResource(Volumes);

  const initialValues = useMemo(() => getVolumeValues(volume), [volume]);
  const handleErrorReset = useCallback(() => {
    resetCreate();
    resetUpdate();
  }, [resetCreate, resetUpdate]);

  const onSubmit = async (values: VolumeFormValues) => {
    try {
      if (volume) {
        await updateVolume({ object: buildVolumeUpdatePayload(values, volume) });
        navigate(`/storage/volumes/${volume.id}`);
        return;
      }

      const response = await createVolume({ object: buildVolumeCreatePayload(values) });
      navigate(response.object?.id ? `/storage/volumes/${response.object.id}` : '/storage/volumes');
    } catch {
      // The mutation error is rendered by OSACWizardFooter.
    }
  };

  return (
    <Formik<VolumeFormValues>
      initialValues={initialValues}
      validationSchema={getVolumeValidationSchema(t)}
      onSubmit={onSubmit}
    >
      <>
        <FieldValidationProvider>
          <LeaveFormConfirmation />
          <PageSection
            hasBodyWrapper={false}
            isFilled
            type={PageSectionTypes.wizard}
            aria-label={t('Volume wizard')}
          >
            <Wizard
              navAriaLabel={t('Volume wizard steps')}
              isVisitRequired
              footer={
                <OSACWizardFooter
                  onCancel={() => navigate('/storage/volumes')}
                  stepHasErrors={volumeStepHasErrors}
                  isEdit={Boolean(volume)}
                  error={createError ?? updateError}
                  onErrorReset={handleErrorReset}
                  submitLabel={volume ? t('Save') : t('Create volume')}
                />
              }
              onStepChange={(_, step) => setCurrentStep(step.id as VolumeWizardStep)}
            >
              <WizardStep id="general" name={t('General')}>
                {currentStep === 'general' && <GeneralStep isEdit={Boolean(volume)} />}
              </WizardStep>
              <WizardStep id="configuration" name={t('Configuration')}>
                {currentStep === 'configuration' && <ConfigurationStep isEdit={Boolean(volume)} />}
              </WizardStep>
              <WizardStep id="review" name={t('Review')}>
                {currentStep === 'review' && <ReviewStep />}
              </WizardStep>
            </Wizard>
          </PageSection>
        </FieldValidationProvider>
      </>
    </Formik>
  );
};
