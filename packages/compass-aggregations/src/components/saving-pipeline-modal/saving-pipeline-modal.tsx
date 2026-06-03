import type { ChangeEvent } from 'react';
import React, { PureComponent } from 'react';
import {
  FormFieldContainer,
  FormModal,
  TextArea,
  TextInput,
} from '@mongodb-js/compass-components';
import {
  MCP_PROMPT_NAME_HINT,
  validateMcpPromptName,
} from '@mongodb-js/my-queries-storage/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import { withTelemetry } from '@mongodb-js/compass-telemetry/provider';

export interface SavingPipelineModalProps {
  isOpen: boolean;
  isSaveAs: boolean;
  name: string;
  description: string;
  mcpPromptName: string;
  savingPipelineCancel: () => void;
  savingPipelineApply: () => void;
  savingPipelineNameChanged: (v: string) => void;
  savingPipelineDescriptionChanged: (v: string) => void;
  savingPipelineMcpPromptNameChanged: (v: string) => void;
  saveCurrentPipeline: () => void;
  clonePipeline: () => void;
  track: TrackFunction;
}

/**
 * Saving pipeline modal. Mirrors the query-bar Save-as-favorite dialog
 * so the metadata users can attach to a saved pipeline (description,
 * MCP prompt name) matches what they can attach to a saved find query.
 * Without this parity, AI agents would only ever see find queries in
 * the MCP catalog — aggregations wouldn't be discoverable.
 */
class SavingPipelineModal extends PureComponent<SavingPipelineModalProps> {
  static displayName = 'SavingPipelineModalComponent';

  componentDidUpdate(prevProps: SavingPipelineModalProps) {
    if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen) {
      this.props.track('Screen', { name: 'save_pipeline_modal' }, undefined);
    }
  }

  onNameChanged = (evt: ChangeEvent<HTMLInputElement>): void => {
    this.props.savingPipelineNameChanged(evt.currentTarget.value);
  };

  onDescriptionChanged = (evt: ChangeEvent<HTMLTextAreaElement>): void => {
    this.props.savingPipelineDescriptionChanged(evt.currentTarget.value);
  };

  onMcpPromptNameChanged = (evt: ChangeEvent<HTMLInputElement>): void => {
    this.props.savingPipelineMcpPromptNameChanged(evt.currentTarget.value);
  };

  /**
   * Calls back to action handlers for changing the name and saving it.
   *
   * If canceling from `Save As...`, the current pipeline is not cloned.
   */
  save = (): void => {
    if (this.props.isSaveAs) {
      this.props.clonePipeline();
    }

    this.props.savingPipelineApply();
    this.props.saveCurrentPipeline();
  };

  /** Live validation for the MCP prompt name — same rules as query bar. */
  private getPromptNameError(): string | null {
    if (this.props.mcpPromptName.length === 0) return null;
    return validateMcpPromptName(this.props.mcpPromptName);
  }

  render() {
    const title = this.props.isSaveAs ? 'Save Pipeline As...' : 'Save Pipeline';
    const promptNameError = this.getPromptNameError();
    return (
      <FormModal
        title={title}
        open={this.props.isOpen}
        onSubmit={this.save}
        onCancel={this.props.savingPipelineCancel}
        submitButtonText="Save"
        submitDisabled={this.props.name === '' || promptNameError !== null}
        data-testid="save-pipeline-modal"
      >
        <FormFieldContainer>
          <TextInput
            id="save-pipeline-name"
            value={this.props.name}
            onChange={this.onNameChanged}
            label="Name"
            name="name"
          />
        </FormFieldContainer>

        <FormFieldContainer>
          <TextArea
            id="save-pipeline-description"
            label="Description (optional)"
            description="Surfaced to AI agents via the MCP catalog. Without a description, this saved pipeline is hidden from the AI."
            name="description"
            value={this.props.description}
            onChange={this.onDescriptionChanged}
          />
        </FormFieldContainer>

        <FormFieldContainer>
          <TextInput
            id="save-pipeline-mcp-prompt-name"
            label="MCP prompt name (optional)"
            description={`When set, surfaces this saved pipeline as a slash command in AI clients — e.g. /${
              this.props.mcpPromptName || 'monthly-revenue'
            }. ${MCP_PROMPT_NAME_HINT}`}
            name="mcp-prompt-name"
            value={this.props.mcpPromptName}
            state={promptNameError ? 'error' : 'none'}
            errorMessage={promptNameError ?? undefined}
            onChange={this.onMcpPromptNameChanged}
          />
        </FormFieldContainer>
      </FormModal>
    );
  }
}

export default withTelemetry(SavingPipelineModal);
