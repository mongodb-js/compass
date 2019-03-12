// import React from 'react';
// import { mount } from 'enzyme';

// import SavingPipelineModal from 'components/saving-pipeline-modal';

// import styles from './saving-pipeline-modal.less';

// describe('SavingPipelineModal [Component]', () => {
//   context('when the component is rendered', () => {
//     let component;

//     const savingPipelineNameChangedSpy = sinon.spy();
//     const savingPipelineApplySpy = sinon.spy();
//     const savingPipelineCancelSpy = sinon.spy();
//     const saveCurrentPipelineSpy = sinon.spy();

//     beforeEach(() => {
//       component = mount(
//         <SavingPipelineModal
//           savingPipelineCancel={savingPipelineCancelSpy}
//           savingPipelineApply={savingPipelineApplySpy}
//           savingPipelineNameChanged={savingPipelineNameChangedSpy}
//           saveCurrentPipeline={saveCurrentPipelineSpy}
//           isOpen
//           name=""
//         />
//       );
//     });

//     afterEach(() => {
//       component = null;
//     });
//   });
//   describe('Save As', () => {
//     it('should have the name input prepopulated');
//     it('should have a relative title');
//   });
// });
