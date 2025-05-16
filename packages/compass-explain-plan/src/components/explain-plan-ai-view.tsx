import { connect } from 'react-redux';
import React from 'react';
import {
  Banner,
  Button,
  css,
  H3,
  Icon,
  spacing,
  IconButton,
  ParagraphSkeleton,
  SpinLoader,
  // LGMarkdown
} from '@mongodb-js/compass-components';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { ExplainPlanModalState } from '../stores/explain-plan-modal-store';
import { generateAIAnalysis } from '../stores/explain-plan-modal-store';

const viewStyles = css({
  display: 'flex',
  flexDirection: 'column',
  margin: spacing[200],
});

const headerStyles = css({
  marginRight: 'auto',
});

const actionsContainerStyles = css({
  display: 'flex',
  gap: '8px',
  marginBottom: '8px',
  alignItems: 'center',
  justifyContent: 'flex-end',
});

type ExplainPlanAIViewProps = {
  onGenerateAIAnalysis: () => void;
  aiFetchStatus: 'initial' | 'loading' | 'success' | 'error';
  aiResponse: string | null;
} & Partial<
  Pick<
    ExplainPlanModalState,
    'aiAnalysisError' | 'explainPlan' | 'rawExplainPlan' | 'error'
  >
>;

type State = {
  error: Error | null;
  // errorOnCompletedMarkdown: boolean;
  // errorOnCompletedMarkdownNormalRender: boolean;
};
type Props = {
  markdown: string;
  isComplete?: boolean;
};

class MarkdownRenderWithBoundary extends React.Component<Props> {
  state: State = {
    error: null,
    // errorOnCompletedMarkdown: false,
    // errorOnCompletedMarkdownNormalRender: false,
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      error,
      // errorOnCompletedMarkdown: false,
      // errorOnCompletedMarkdownNormalRender: false,
    };
  }

  // componentDidCatch(): void {
  //   if (!this.state.error) {
  //     this.setState({ error: new Error('An error occurred') });
  //   } else if (this.props.isComplete && !this.state.errorOnCompletedMarkdown) {
  //     this.setState({
  //       errorOnCompletedMarkdown: true
  //     });
  //   } else if (this.props.isComplete && !this.state.errorOnCompletedMarkdownNormalRender) {
  //     this.setState({
  //       errorOnCompletedMarkdownNormalRender: true
  //     });
  //   }
  // }

  render(): React.ReactNode {
    const { isComplete, markdown } = this.props;
    // const { error, errorOnCompletedMarkdown, errorOnCompletedMarkdownNormalRender } = this.state;
    const { error } = this.state;

    // if (errorOnCompletedMarkdownNormalRender) {
    //   return <div>{markdown}</div>;
    // }
    // if (errorOnCompletedMarkdown) {
    //   return (
    //     <Markdown>{markdown}</Markdown>
    //   );
    // }
    if (error || !isComplete) {
      return <Markdown>{markdown}</Markdown>;
    }
    // console.log('aaa markdown', markdown);
    return (
      <Markdown
        remarkPlugins={[remarkGfm]}
        // unwrapDisallowed
      >
        {markdown}
      </Markdown>
    );
  }
}

export const ExplainPlanAIView: React.FunctionComponent<
  ExplainPlanAIViewProps
> = ({
  explainPlan,
  aiAnalysisError,
  onGenerateAIAnalysis,
  error,
  rawExplainPlan,
  aiFetchStatus,
  aiResponse,
}) => {
  const isParsingError = Boolean(error && rawExplainPlan && !explainPlan);

  if (error && !isParsingError) {
    return <Banner variant="danger">{error}</Banner>;
  }

  if (aiAnalysisError) {
    return <Banner variant="danger">{aiAnalysisError}</Banner>;
  }

  return (
    <div className={viewStyles}>
      {/* {aiFetchStatus === 'loading' ? (
        <Button></Button>
      )} */}
      {/* <IconButton
        onClick={getAIAnalysis}
        title="Refresh"
        aria-label="Refresh"
        
      >
        <Icon
          glyph="Refresh"
        />
      </IconButton> */}
      <div className={actionsContainerStyles}>
        <H3 className={headerStyles}>Explain Plan Analysis</H3>
        {/* <IconButton
          onClick={getAIAnalysis}
          title="Refresh"
          aria-label="Refresh"
          
        >
          <Icon
            glyph="Refresh"
          />
        </IconButton> */}
        <Button
          onClick={onGenerateAIAnalysis}
          // isLoading={aiFetchStatus === 'loading'}
          disabled={aiFetchStatus === 'loading'}
          leftGlyph={
            aiFetchStatus === 'loading' ? (
              <SpinLoader title="Analyzing…" />
            ) : (
              <Icon glyph="Refresh" />
            )
          }
        >
          {aiFetchStatus === 'loading' ? 'Analyzing…' : 'Refresh'}
        </Button>
      </div>
      {aiFetchStatus === 'loading' && !aiResponse && <ParagraphSkeleton />}
      {(aiFetchStatus === 'success' || aiFetchStatus === 'loading') &&
        aiResponse && (
          <div>
            <MarkdownRenderWithBoundary
              isComplete={aiFetchStatus === 'success'}
              markdown={aiResponse}
            />
            {/* {aiResponse} */}
            {/* <Markdown remarkPlugins={[remarkGfm]}>{aiResponse}</Markdown> */}
            {/* </MarkdownRenderWithBoundary> */}
          </div>
        )}
    </div>
  );
};

const ConnectedExplainPlanAIView = connect(
  (state: ExplainPlanModalState) => {
    return {
      aiFetchStatus: state.aiFetchStatus,
      aiResponse: state.aiAnalysisResponse,
      error: state.error,
      rawExplainPlan: state.rawExplainPlan,
      explainPlan: state.explainPlan,
      aiAnalysisError: state.aiAnalysisError,
    };
  },
  {
    onGenerateAIAnalysis: generateAIAnalysis,
  }
)(ExplainPlanAIView);

export default ConnectedExplainPlanAIView;
