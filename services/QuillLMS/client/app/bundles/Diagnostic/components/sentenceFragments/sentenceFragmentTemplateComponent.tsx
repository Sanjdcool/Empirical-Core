declare function require(name:string);
import * as React from 'react';
import { connect } from 'react-redux';
import {checkDiagnosticSentenceFragment, Response } from 'quill-marking-logic'
import * as _ from 'underscore';

import TextEditor from '../renderForQuestions/renderTextEditor.jsx';
import {
  getGradedResponsesWithCallback
} from '../../actions/responses';
import updateResponseResource from '../renderForQuestions/updateResponseResource.js';
import Feedback from '../renderForQuestions/feedback';
import RenderQuestionFeedback from '../renderForQuestions/feedbackStatements.jsx';
import { hashToCollection, ConceptExplanation, getLatestAttempt, renderPreviewFeedback, getDisplayedText } from '../../../Shared/index'

class PlaySentenceFragment extends React.Component<any, any> {
  constructor(props) {
    super(props)

    this.state = {
      response: props.question.prompt,
      checkAnswerEnabled: true,
      editing: false,
    }
  }

  componentDidMount() {
    const { question, } = this.props
    getGradedResponsesWithCallback(
      question.key,
      (data) => {
        this.setState({ responses: data, });
      }
    );
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { question, } = this.props
    if (nextProps.question.attempts.length !== question.attempts.length) {
      this.setState({editing: false})
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { question, } = this.props
    const { response, responses, } = this.state
    if (question !== nextProps.question) {
      return true;
    } else if (response !== nextState.response) {
      return true;
    } else if (responses !== nextState.responses) {
      return true;
    }
    return false;
  }

  showNextQuestionButton = () => {
    const { question, previewMode } = this.props;
    const latestAttempt = getLatestAttempt(question.attempts);
    const readyForNext = (previewMode && latestAttempt) || question.attempts.length > 4 || (latestAttempt && latestAttempt.response.optimal);
    if (readyForNext) {
      return true;
    } else {
      return false;
    }
  }

  getQuestion = () => {
    const { question, } = this.props
    return question;
  }

  getResponses = () => {
    const { responses, } = this.state
    return responses;
  }

  handleClickCompleteSentence = () => this.checkChoice('Sentence')

  handleClickIncompleteSentence = () => this.checkChoice('Fragment')

  checkChoice = (choice) => {
    const { question, markIdentify, } = this.props
    const questionType = question.isFragment ? 'Fragment' : 'Sentence';
    markIdentify(choice === questionType);
  }

  renderSentenceOrFragmentButtons = () => {
    return (
      <div className="sf-button-group">
        <button className="button sf-button focus-on-light" onClick={this.handleClickCompleteSentence} type="button" value="Sentence">Complete Sentence</button>
        <button className="button sf-button focus-on-light" onClick={this.handleClickIncompleteSentence} type="button" value="Fragment">Incomplete Sentence</button>
      </div>
    );
  }

  choosingSentenceOrFragment = () => {
    const { question, } = this.props;
    return question.identified === undefined && (question.needsIdentification === undefined || question.needsIdentification === true);
    // the case for question.needsIdentification===undefined is for sentenceFragments that were created before the needsIdentification field was put in
  }

  handleChange = (e) => {
    this.setState({
      response: e,
      editing: true,
    });
  }

  handleSubmitResponse = () => {
    const { checkAnswerEnabled, responses, response, } = this.state
    const { currentKey, question, updateAttempts, handleAttemptSubmission, dispatch, } = this.props
    if (checkAnswerEnabled && responses) {
      const key = currentKey;
      const { attempts, } = question;
      this.setState({ checkAnswerEnabled: false, }, () => {
        const { prompt, wordCountChange, ignoreCaseAndPunc, incorrectSequences, focusPoints, concept_uid, modelConceptUID, conceptID } = this.getQuestion();
        const defaultConceptUID = modelConceptUID || concept_uid || conceptID
        const responses = hashToCollection(this.getResponses())
        const fields = {
          question_uid: key,
          response,
          responses,
          wordCountChange,
          ignoreCaseAndPunc,
          prompt,
          incorrectSequences,
          focusPoints,
          checkML: false,
          mlUrl: 'https://nlp.quill.org',
          defaultConceptUID
        }
        checkDiagnosticSentenceFragment(fields).then((resp) => {
          const matched = {response: resp}
          if (typeof(matched) === 'object') {
            updateResponseResource(matched, key, attempts, dispatch, );
            updateAttempts(matched);
            this.setState({ checkAnswerEnabled: true, });
            handleAttemptSubmission();
          }
        })
      });
    }
  }

  getNegativeConceptResultsForResponse(conceptResults) {
    return hashToCollection(conceptResults).filter(cr => !cr.correct);
  }

  getNegativeConceptResultForResponse(conceptResults) {
    const negCRs = this.getNegativeConceptResultsForResponse(conceptResults);
    return negCRs.length > 0 ? negCRs[0] : undefined;
  }

  renderConceptExplanation = () => {
    const { conceptsFeedback, question, } = this.props
    if (!this.showNextQuestionButton()) {
      const latestAttempt:{response: Response}|undefined = getLatestAttempt(question.attempts);
      if (latestAttempt && latestAttempt.response) {
        if (!latestAttempt.response.optimal && latestAttempt.response.conceptResults) {
          const conceptID = this.getNegativeConceptResultForResponse(latestAttempt.response.conceptResults);
          if (conceptID) {
            const data = conceptsFeedback.data[conceptID.conceptUID];
            if (data) {
              return <ConceptExplanation {...data} />;
            }
          }
        } else if (latestAttempt.response && !latestAttempt.response.optimal && latestAttempt.response.concept_results) {
          const conceptID = this.getNegativeConceptResultForResponse(latestAttempt.response.concept_results);
          if (conceptID) {
            const data = conceptsFeedback.data[conceptID.conceptUID];
            if (data) {
              return <ConceptExplanation {...data} />;
            }
          }
        } else if (this.getQuestion() && this.getQuestion().modelConceptUID) {
          const dataF = conceptsFeedback.data[this.getQuestion().modelConceptUID];
          if (dataF) {
            return <ConceptExplanation {...dataF} />;
          }
        } else if (this.getQuestion().conceptID) {
          const data = conceptsFeedback.data[this.getQuestion().conceptID];
          if (data) {
            return <ConceptExplanation {...data} />;
          }
        }
      }
    }
  }

  renderSentenceOrFragmentMode = () => {
    return (
      <div className="container">
        <div className="feedback-row">
          <Feedback
            feedback={(<p>Is this a complete or an incomplete sentence?</p>)}
            feedbackType="default"
          />
        </div>
        {this.renderSentenceOrFragmentButtons()}
      </div>
    );
  }

  renderButton = () => {
    const { nextQuestion, question, isLastQuestion, previewMode } = this.props
    const { responses, editing} = this.state
    if (this.showNextQuestionButton()) {
      const disabled = isLastQuestion && previewMode;
      const disabledStyle = disabled ? 'disabled' : '';
      return (
        <button className={`quill-button focus-on-light large primary contained ${disabledStyle}`} disabled={disabled} onClick={nextQuestion} type="button">Next</button>
      );
    } else if (responses) {
      if(previewMode && question.attempts.length > 0) {
        return <button className="quill-button focus-on-light large primary contained disabled" type="button">Submit</button>;
      } else if (!previewMode && question.attempts.length) {
        const buttonClass = editing ? "quill-button focus-on-light large primary contained" : "quill-button focus-on-light large primary contained disabled" ;
        return <button className={buttonClass} onClick={this.handleSubmitResponse} type="button">Recheck work</button>;
      } else {
        return <button className="quill-button focus-on-light large primary contained" onClick={this.handleSubmitResponse} type="button">Submit</button>;
      }
    } else {
      <button className="quill-button focus-on-light large primary contained disabled" type="button">Submit</button>;
    }
  }

  renderFeedbackStatements(attempt) {
    return <RenderQuestionFeedback attempt={attempt} getErrorsForAttempt={this.getErrorsForAttempt} getQuestion={this.getQuestion} />;
  }

  renderFeedback = () => {
    const { question, previewMode } = this.props
    let instructions;
    const latestAttempt = getLatestAttempt(question.attempts);
    if(previewMode && latestAttempt) {
      renderPreviewFeedback(latestAttempt);
    } else if (latestAttempt) {
      const component = <span dangerouslySetInnerHTML={{__html: latestAttempt.response.feedback}} />
      instructions = latestAttempt.response.feedback ? component :
        'Revise your work. A complete sentence must have an action word and a person or thing doing the action.';
    } else if (question.instructions && question.instructions !== '') {
      instructions = question.instructions;
    } else {
      instructions = 'If it is a complete sentence, press submit. If it is an incomplete sentence, make it complete.';
    }
    if(instructions) {
      return(
        <Feedback
          getQuestion={this.getQuestion}
          question={question}
          renderFeedbackStatements={this.renderFeedbackStatements}
          responses={this.getResponses()}
          sentence={instructions}
        />
      );
    }
  }

  renderPlaySentenceFragmentMode = () => {
    const { response } = this.state;
    const { question, previewMode } = this.props
    let instructions;
    const displayedText = getDisplayedText({ previewMode, question, response });
    const latestAttempt = getLatestAttempt(question.attempts);
    if(previewMode && latestAttempt) {
      renderPreviewFeedback(latestAttempt);
    } else if (latestAttempt) {
      const component = <span dangerouslySetInnerHTML={{__html: latestAttempt.response.feedback}} />
      instructions = latestAttempt.response.feedback ? component :
        'Revise your work. A complete sentence must have an action word and a person or thing doing the action.';
    } else if (question.instructions && question.instructions !== '') {
      instructions = question.instructions;
    } else {
      instructions = 'If it is a complete sentence, press submit. If it is an incomplete sentence, make it complete.';
    }
    // dangerously set some html in here
    return (
      <div className="container">
        {this.renderFeedback()}
        <TextEditor
          disabled={this.showNextQuestionButton()}
          onChange={this.handleChange}
          onSubmitResponse={this.handleSubmitResponse}
          placeholder="Type your answer here."
          value={displayedText}
        />
        <div className="question-button-group">
          {this.renderButton()}
        </div>
        {this.renderConceptExplanation()}
      </div>
    );
  }

  renderInteractiveComponent = () => {
    if (this.choosingSentenceOrFragment()) {
      return this.renderSentenceOrFragmentMode();
    } else {
      return this.renderPlaySentenceFragmentMode();
    }
  }

  render() {
    const { question, } = this.props
    if (question) {
      return (
        <div className="student-container-inner-diagnostic">
          <div className="draft-js sentence-fragments">
            <p>{this.getQuestion().prompt}</p>
          </div>
          {this.renderInteractiveComponent()}
        </div>
      );
    } else {
      return (<div className="container">Loading...</div>);
    }
  }
}

function select(state) {
  return {
    conceptsFeedback: state.conceptsFeedback,
  };
}

export default connect(select)(PlaySentenceFragment);
