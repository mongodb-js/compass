import type { ChangeEvent } from 'react';
import React, { PureComponent } from 'react';
import {
  FormModal,
  TextInput,
  useTranslation,
} from '@mongodb-js/compass-components';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { TranslateFn } from '@mongodb-js/compass-components';
import { withTelemetry } from '@mongodb-js/compass-telemetry/provider';

const WithTranslation: React.FunctionComponent<{
  children: (t: TranslateFn) => React.ReactElement;
}> = ({ children }) => {
  return children(useTranslation());
};

export interface SavingPipelineModalProps {
  isOpen: boolean;
  isSaveAs: boolean;
  name: string;
  savingPipelineCancel: () => void;
  savingPipelineApply: () => void;
  savingPipelineNameChanged: (v: string) => void;
  saveCurrentPipeline: () => void;
  clonePipeline: () => void;
  track: TrackFunction;
}

/**
 * Saving pipeline modal.
 */
class SavingPipelineModal extends PureComponent<SavingPipelineModalProps> {
  static displayName = 'SavingPipelineModalComponent';

  componentDidUpdate(prevProps: SavingPipelineModalProps) {
    if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen) {
      this.props.track('Screen', { name: 'save_pipeline_modal' }, undefined);
    }
  }

  /**
   * Handle the value of the input being changed.
   *
   * @param {Event} evt
   * @returns {void}
   */
  onNameChanged(evt: ChangeEvent<HTMLInputElement>): void {
    this.props.savingPipelineNameChanged(evt.currentTarget.value);
  }

  /**
   * Calls back to action handlers for changing the name and saving it.
   *
   * If canceling from `Save As...`, the current pipeline is not cloned.
   * @returns {void}
   */
  save() {
    if (this.props.isSaveAs) {
      this.props.clonePipeline();
    }

    this.props.savingPipelineApply();
    this.props.saveCurrentPipeline();
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <WithTranslation>
        {(t) => (
          <FormModal
            title={
              this.props.isSaveAs
                ? t(
                    'aggregations.savePipeline.titleSaveAs',
                    'Save Pipeline As...'
                  )
                : t('aggregations.savePipeline.title', 'Save Pipeline')
            }
            open={this.props.isOpen}
            onSubmit={this.save.bind(this)}
            onCancel={this.props.savingPipelineCancel}
            submitButtonText={t('aggregations.savePipeline.save', 'Save')}
            submitDisabled={this.props.name === ''}
            data-testid="save-pipeline-modal"
          >
            <TextInput
              id="save-pipeline-name"
              value={this.props.name}
              onChange={this.onNameChanged.bind(this)}
              label={t('aggregations.savePipeline.name', 'Name')}
              name="name"
            />
          </FormModal>
        )}
      </WithTranslation>
    );
  }
}

export default withTelemetry(SavingPipelineModal);
