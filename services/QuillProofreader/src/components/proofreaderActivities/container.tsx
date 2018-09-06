import * as React from "react";
import * as Redux from "redux";
import {connect} from "react-redux";
import * as request from 'request';
import _ from 'lodash';
const questionIconSrc = 'https://assets.quill.org/images/icons/question_icon.svg'

import getParameterByName from '../../helpers/getParameterByName';
import { startListeningToActivity } from "../../actions/proofreaderActivities";
import { startListeningToConcepts } from "../../actions/concepts";
import {
  updateSessionOnFirebase,
  startListeningToQuestions,
  goToNextQuestion,
  checkAnswer,
  setSessionReducerToSavedSession
} from "../../actions/session";
import { getConceptResultsForAllQuestions, calculateScoreForLesson } from '../../helpers/conceptResultsGenerator'
import { SessionState } from '../../reducers/sessionReducer'
import { ProofreaderActivityState } from '../../reducers/proofreaderActivitiesReducer'
import { Question, FormattedConceptResult } from '../../interfaces/questions'
import PassageEditor from './passageEditor'
import PassageReviewer from './passageReviewer'
import EarlySubmitModal from './earlySubmitModal'
import ReviewModal from './reviewModal'
import LoadingSpinner from '../shared/loading_spinner'

interface PlayProofreaderContainerProps {
  proofreaderActivities: ProofreaderActivityState;
  session: SessionState;
  dispatch: Function;
}

interface PlayProofreaderContainerState {
  edits: Array<string>;
  reviewing: boolean;
  showEarlySubmitModal: boolean;
  showReviewModal: boolean;
  correctEdits?: Array<String>;
  numberOfCorrectChanges?: number;
  passage?: string;
  originalPassage?: string;
  reviewablePassage?: string;
}

export class PlayProofreaderContainer extends React.Component<PlayProofreaderContainerProps, PlayProofreaderContainerState> {
    constructor(props: any) {
      super(props);

      this.state = {
        edits: [],
        reviewing: false,
        showEarlySubmitModal: false
      }

      this.saveToLMS = this.saveToLMS.bind(this)
      this.finishActivitySession = this.finishActivitySession.bind(this)
      this.createAnonActivitySession = this.createAnonActivitySession.bind(this)
      this.handlePassageChange = this.handlePassageChange.bind(this)
      this.checkWork = this.checkWork.bind(this)
      this.renderShowEarlySubmitModal = this.renderShowEarlySubmitModal.bind(this)
      this.closeEarlySubmitModal = this.closeEarlySubmitModal.bind(this)
      this.renderShowReviewModal = this.renderShowReviewModal.bind(this)
      this.closeReviewModal = this.closeReviewModal.bind(this)
    }

    componentWillMount() {
      const activityUID = getParameterByName('uid', window.location.href)
      const sessionID = getParameterByName('student', window.location.href)

      this.props.dispatch(startListeningToConcepts())

      if (sessionID) {
        this.props.dispatch(setSessionReducerToSavedSession(sessionID))
      }

      if (activityUID) {
        this.props.dispatch(startListeningToActivity(activityUID))
      }

    }

    // extractEditsFromPassage(passage: string) {
    //   const edits = {};
    //
    //   passage.replace(/{\+([^-]+)-([^|]+)\|([^}]+)}/g, (key, plus, minus, conceptUID) => {
    //     const genKey = Math.random();
    //     edits[genKey] = {
    //       plus: plus,
    //       minus: minus,
    //       conceptUID: conceptUID
    //     };
    //     passage = passage.replace(key, genKey);
    //   });
    //   passage.replace(/{-([^|]+)\+([^-]+)\|([^}]+)}/g, (key, minus, plus, conceptUID) => {
    //     const genKey = Math.random();
    //     edits[genKey] = {
    //       plus: plus,
    //       minus: minus,
    //       conceptUID: conceptUID
    //     };
    //     passage = passage.replace(key, genKey);
    //   });
    //   return [edits, passage];
    // }
    //
    formatInitialPassage(passage: string, underlineErrors: boolean) {
      let correctEdits = []
      passage.replace(/{\+([^-]+)-([^|]+)\|([^}]+)}/g, (key: string, plus: string, minus: string, conceptUID: string) => {
        // if (underlineErrors) {
          // passage = passage.replace(key, `<span id="${key}">${minus}</span>`);
        // } else {
          passage = passage.replace(key, `<u id="${correctEdits.length}">${minus}</u>`);
        // }
        correctEdits.push(key)
      });
      return {passage, correctEdits}
    }

    componentWillReceiveProps(nextProps: PlayProofreaderContainerProps) {
      if (nextProps.proofreaderActivities.hasreceiveddata) {
        const { passage, underlineErrorsInProofreader } = nextProps.proofreaderActivities.currentActivity
        const initialPassageData = this.formatInitialPassage(passage, underlineErrorsInProofreader)
        const formattedPassage = initialPassageData.passage
        // let uneditedPassage = passage
        // passage.replace(/{\+([^-]+)-([^|]+)\|([^}]+)}/g, (key, plus, minus, conceptUID) => {
        //   uneditedPassage = passage.replace(key, minus);
        // });
        this.setState({passage: formattedPassage, originalPassage: formattedPassage, correctEdits: initialPassageData.correctEdits})

        // const passageWithEdits = this.extractEditsFromPassage(nextProps.proofreaderActivities.currentActivity.passage)
      }
      // if (nextProps.proofreaderActivities.hasreceiveddata && !nextProps.session.hasreceiveddata && !nextProps.session.error) {
      //   const concepts = nextProps.proofreaderActivities.currentActivity.concepts
      //   this.props.dispatch(startListeningToQuestions(concepts))
      // }
      //
      // if (nextProps.session.hasreceiveddata && !nextProps.session.currentQuestion && nextProps.session.unansweredQuestions.length === 0 && nextProps.session.answeredQuestions.length > 0) {
      //   this.saveToLMS(nextProps.session)
      // } else if (nextProps.session.hasreceiveddata && !nextProps.session.currentQuestion) {
      //   this.props.dispatch(goToNextQuestion())
      // }
      //
      const sessionID = getParameterByName('student', window.location.href)
      if (sessionID && !_.isEqual(nextProps.session, this.props.session)) {
        updateSessionOnFirebase(sessionID, nextProps.session)
      }

    }

    saveToLMS(questions: SessionState) {
      const results = getConceptResultsForAllQuestions(questions.answeredQuestions);
      const score = calculateScoreForLesson(questions.answeredQuestions);
      const activityUID = getParameterByName('uid', window.location.href)
      const sessionID = getParameterByName('student', window.location.href)
      if (sessionID) {
        this.finishActivitySession(sessionID, results, score);
      } else if (activityUID) {
        this.createAnonActivitySession(activityUID, results, score);
      }
    }

    finishActivitySession(sessionID: string, results: FormattedConceptResult[], score: number) {
      request(
        { url: `${process.env.EMPIRICAL_BASE_URL}/api/v1/activity_sessions/${sessionID}`,
          method: 'PUT',
          json:
          {
            state: 'finished',
            concept_results: results,
            percentage: score,
          },
        },
        (err, httpResponse, body) => {
          if (httpResponse && httpResponse.statusCode === 200) {
            const sessionID = getParameterByName('student', window.location.href)
            document.location.href = `${process.env.EMPIRICAL_BASE_URL}/activity_sessions/${sessionID}`;
            this.setState({ saved: true, });
          } else {
            this.setState({
              saved: false,
              error: true,
            });
          }
        }
      );
    }

    createAnonActivitySession(lessonID: string, results: FormattedConceptResult[], score: number) {
      request(
        { url: `${process.env.EMPIRICAL_BASE_URL}/api/v1/activity_sessions/`,
          method: 'POST',
          json:
          {
            state: 'finished',
            activity_uid: lessonID,
            concept_results: results,
            percentage: score,
          },
        },
        (err, httpResponse, body) => {
          if (httpResponse.statusCode === 200) {
            document.location.href = `${process.env.EMPIRICAL_BASE_URL}/activity_sessions/${body.activity_session.uid}`;
            this.setState({ saved: true, });
          }
        }
      );
    }

    formatReceivedPassage(value: string) {
      // this method handles the fact that Slate will sometimes create additional strong tags rather than adding text inside of one
      let string = value.replace(/<span data-original-index="\d+">|<\/span>|<strong> <\/strong>/gm, '').replace(/&#x27;/g, "'")
      // regex below matches case that looks like this: <strong><u id="3">Addison</u></strong><strong><u id="3">,</u></strong><strong><u id="3"> Parker, and Julian,</u></strong>
      const tripleStrongTagWithThreeMatchingURegex = /<strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong><strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong><strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong>/gm
      // regex below matches case that looks like this: <strong><u id="3">Addison</u></strong><strong>,</strong><strong><u id="3"> Parker, and Julian,</u></strong>
      const tripleStrongTagWithTwoMatchingURegex = /<strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong><strong>([^(<]+?)<\/strong><strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong>/gm
      // regex below matches case that looks like this: <strong><u id="3">Addison</u></strong><strong><u id="3">, Parker, and Julian,</u></strong>
      const doubleStrongTagWithTwoMatchingURegex = /<strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong><strong>(<u id="\d+">)([^(<]+?)<\/u><\/strong>/gm
      // regex below matches case that looks like this: <strong>Addison</strong><strong><u id="3">, Parker, and Julian,</u></strong>
      const doubleStrongTagWithURegex = /<strong>([^(<)]+?)<\/strong><strong>(<u id="\d+">)(.+?)<\/u><\/strong>/gm
      // regex below matches case that looks like this: <strong>A</strong><strong>ntartctic</strong>
      const doubleStrongTagRegex = /<strong>[^(<)]+?<\/strong><strong>[^(<)]+?<\/strong>/gm
      if (tripleStrongTagWithThreeMatchingURegex.test(string)) {
        string = string.replace(tripleStrongTagWithThreeMatchingURegex, (key, uTagA, contentA, uTagB, contentB, uTagC, contentC) => {
          if (uTagA === uTagB && uTagB === uTagC) {
            return `<strong>${uTagA}${contentA}${contentB}${contentC}</u></strong>`
          } else {
            return key
          }
        })
      }
      if (tripleStrongTagWithTwoMatchingURegex.test(string)) {
        string = string.replace(tripleStrongTagWithTwoMatchingURegex, (key, uTagA, contentA, contentB, uTagC, contentC) => {
          if (uTagA === uTagC) {
            return `<strong>${uTagA}${contentA}${contentB}${contentC}</u></strong>`
          } else {
            return key
          }
        })
      }
      if (doubleStrongTagWithTwoMatchingURegex.test(string)) {
        string = string.replace(doubleStrongTagWithTwoMatchingURegex, (key, uTagA, contentA, uTagB, contentB) => {
          if (uTagA === uTagB) {
            return `<strong>${uTagA}${contentA}${contentB}</u></strong>`
          } else {
            return key
          }
        })
      }
      if (doubleStrongTagWithURegex.test(string)) {
        string = string.replace(doubleStrongTagWithURegex, (key, contentA, uTag, contentB) => {
          return `<strong>${uTag}${contentA}${contentB}</u></strong>`
        })
      }
      if (doubleStrongTagRegex.test(string)) {
        string = string.replace(doubleStrongTagRegex, (key) => {
          return key.replace(/<\/strong><strong>/, '')
        })
      }
      return string
    }

    handlePassageChange(value: string) {
      const formattedValue = this.formatReceivedPassage(value)
      const regex = /<strong>.*?<\/strong>/gm
      const edits = formattedValue.match(regex)
      if (edits && !_.isEqual(edits, this.state.edits)) {
        this.setState({ passage: formattedValue, edits })
      }
    }

    checkWork() {
      const { edits, correctEdits } = this.state
      const requiredEditCount = correctEdits && correctEdits.length ? Math.floor(correctEdits.length/2) : 5
      if (correctEdits && correctEdits.length && edits.length === 0 || edits.length < requiredEditCount) {
        this.setState({showEarlySubmitModal: true})
      } else {
        const editedPassage = this.state.passage
        // const { edits } = this.state
        let numberOfCorrectChanges = 0
        const correctEditRegex = /\+([^-]+)-/m
        const conceptUIDRegex = /\|([^}]+)}/m
        if (editedPassage) {
          const gradedPassage = editedPassage.replace(/<strong>(.*?)<\/strong>/gm , (key, edit) => {
            const uTag = edit.match(/<u id="(\d+)">(.+)<\/u>/m)
            if (uTag && uTag.length) {
              const id = uTag[1]
              const text = uTag[2]
              if (correctEdits && correctEdits[id]) {
                const correctEdit = correctEdits[id].match(correctEditRegex) ? correctEdits[id].match(correctEditRegex)[1] : ''
                const conceptUID = correctEdits[id].match(conceptUIDRegex) ? correctEdits[id].match(conceptUIDRegex)[1] : ''
                if (text === correctEdit) {
                  numberOfCorrectChanges++
                  return `{+${text}-|${conceptUID}} `
                } else {
                  return `{+${correctEdit}-${text}|${conceptUID}} `
                }
              } else {
                return `{+${text}-|unnecessary} `
              }
            } else {
              return `{+${edit}-|unnecessary} `
            }
          })
          const reviewablePassage = gradedPassage.replace(/<u id="(\d+)">(.+?)<\/u>/gm, (key, id, text) => {
            if (correctEdits && correctEdits[id]) {
              return correctEdits[id]
            } else {
              return `${text} `
            }
          }).replace(/<br\/>/gm, '')
          this.setState({ reviewablePassage, showReviewModal: true, numberOfCorrectChanges: numberOfCorrectChanges})
        }
      }
    }

    renderShowEarlySubmitModal() {
      const { showEarlySubmitModal, correctEdits } = this.state
      const requiredEditCount = correctEdits && correctEdits.length ? Math.floor(correctEdits.length/2) : 5
      if (showEarlySubmitModal) {
        return <EarlySubmitModal
          requiredEditCount={requiredEditCount}
          closeModal={this.closeEarlySubmitModal}
        />
      }
    }

    renderShowReviewModal() {
      const { showReviewModal, correctEdits, numberOfCorrectChanges } = this.state
      const numberOfErrors = correctEdits && correctEdits.length ? correctEdits.length : 0
      if (showReviewModal) {
        return <ReviewModal
          numberOfErrors={numberOfErrors}
          numberOfCorrectChanges={numberOfCorrectChanges || 0}
          closeModal={this.closeReviewModal}
        />
      }
    }

    renderPassage() {
      const { reviewing, reviewablePassage, originalPassage } = this.state
      if (reviewing) {
        const text = reviewablePassage ? reviewablePassage : ''
        return <PassageReviewer
          text={text}
          concepts={this.props.concepts.data[0]}
        />
      } else if (originalPassage) {
        return <PassageEditor
          text={originalPassage}
          handleTextChange={this.handlePassageChange}
        />
      }
    }

    closeEarlySubmitModal() {
      this.setState({ showEarlySubmitModal: false })
    }

    closeReviewModal() {
      this.setState({ showReviewModal: false, reviewing: true })
    }

    render(): JSX.Element {
      const { edits, correctEdits} = this.state
      const { currentActivity } = this.props.proofreaderActivities
      if (this.props.proofreaderActivities.hasreceiveddata) {
        const className = currentActivity.underlineErrorsInProofreader ? 'underline-errors' : ''
        const meterWidth = edits.length / correctEdits.length * 100
        return <div className="passage-container">
          <div className="header-section">
            <div className="inner-header">
              <h1>{currentActivity.title}</h1>
              <div className="instructions">
                <div>
                  <img src={questionIconSrc} />
                  <p>{currentActivity.description}</p>
                </div>
                <div className="edits-made">
                  <p>Edits Made: {edits.length} of {correctEdits.length}</p>
                  <div className="progress-bar-indication">
                    <span className="meter"
                      style={{width: `${meterWidth}%`}}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {this.renderShowEarlySubmitModal()}
          {this.renderShowReviewModal()}
          <div className={`passage ${className}`}>
            {this.renderPassage()}
          </div>
          <div className="bottom-section">
            <button onClick={this.checkWork}>Check Work</button>
          </div>
        </div>
      } else if (this.props.session.error) {
        return (
          <div>{this.props.session.error}</div>
        );
      } else {
        return <LoadingSpinner />
      }
    }
}

const mapStateToProps = (state: any) => {
    return {
        proofreaderActivities: state.proofreaderActivities,
        session: state.session,
        concepts: state.concepts
    };
};

const mapDispatchToProps = (dispatch: Redux.Dispatch<any>) => {
    return {
        dispatch
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(PlayProofreaderContainer);
