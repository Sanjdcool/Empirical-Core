import * as React from "react";
import queryString from 'query-string';
import { connect } from "react-redux";
import stripHtml from "string-strip-html";
import ReactHtmlParser, { convertNodeToElement, } from 'react-html-parser'

import PromptStep from './promptStep'
import StepLink from './stepLink'
import ReadAndHighlightInstructions from './readAndHighlightInstructions'
import DirectionsSectionAndModal from './directionsSectionAndModal'
import BottomNavigation from './bottomNavigation'
import StepOverview from './stepOverview'
import HeaderImage from './headerImage'

import { explanationData } from "../activitySlides/explanationData";
import ExplanationSlide from "../activitySlides/explanationSlide";
import WelcomeSlide from "../activitySlides/welcomeSlide";
import PostActivitySlide from '../activitySlides/postActivitySlide';
import LoadingSpinner from '../shared/loadingSpinner'
import { getActivity } from "../../actions/activities";
import { TrackAnalyticsEvent } from "../../actions/analytics";
import { Events } from '../../modules/analytics'
import { completeActivitySession,
         fetchActiveActivitySession,
         getFeedback,
         processUnfetchableSession,
         saveActiveActivitySession } from '../../actions/session'
import { generateConceptResults, } from '../../libs/conceptResults'
import { ActivitiesReducerState } from '../../reducers/activitiesReducer'
import { SessionReducerState } from '../../reducers/sessionReducer'
import getParameterByName from '../../helpers/getParameterByName';
import { Passage } from '../../interfaces/activities'
import { postTurkSession } from '../../utils/turkAPI';
import {
  roundMillisecondsToSeconds,
  KEYDOWN,
  MOUSEMOVE,
  MOUSEDOWN,
  CLICK,
  KEYPRESS,
  VISIBILITYCHANGE
} from '../../../Shared/index'

const bigCheckSrc =  `${process.env.CDN_URL}/images/icons/check-circle-big.svg`
const tadaSrc =  `${process.env.CDN_URL}/images/illustrations/tada.svg`

interface StudentViewContainerProps {
  dispatch: Function;
  activities: ActivitiesReducerState;
  session: SessionReducerState;
  location?: any;
  handleFinishActivity?: () => void;
  isTurk?: boolean;
  user: string;
}

interface StudentViewContainerState {
  activeStep?: number;
  activityIsComplete: boolean;
  activityIsReadyForSubmission: boolean;
  explanationSlidesCompleted: boolean;
  explanationSlideStep:  number;
  completedSteps: Array<number>;
  isIdle: boolean;
  showFocusState: boolean;
  startTime: number;
  timeTracking: { [key:string]: number };
  studentHighlights: string[];
  doneHighlighting: boolean;
  showReadTheDirectionsModal: boolean;
  scrolledToEndOfPassage: boolean;
  hasStartedReadPassageStep: boolean;
  hasStartedPromptSteps: boolean;
}

const ONBOARDING = 'onboarding'
const READ_PASSAGE_STEP = 1
const ALL_STEPS = [READ_PASSAGE_STEP, 2, 3, 4]
const MINIMUM_STUDENT_HIGHLIGHT_COUNT = 2

export const StudentViewContainer = ({ dispatch, activities, session, location, handleFinishActivity, isTurk, user }: StudentViewContainerProps) => {
  const step1 = React.createRef() // eslint-disable-line react/sort-comp
  const step2 = React.createRef() // eslint-disable-line react/sort-comp
  const step3 = React.createRef() // eslint-disable-line react/sort-comp
  const step4 = React.createRef() // eslint-disable-line react/sort-comp
  const shouldSkipToPrompts = window.location.href.includes('turk') || window.location.href.includes('skipToPrompts')

  const [activeStep, setActiveStep] = React.useState<number>(shouldSkipToPrompts ? READ_PASSAGE_STEP + 1: READ_PASSAGE_STEP);
  const [activityIsComplete, setActivityIsComplete] = React.useState<boolean>(false);
  const [activityIsReadyForSubmission, setActivityIsReadyForSubmission] = React.useState<boolean>(false);
  const [explanationSlidesCompleted, setExplanationSlidesCompleted] = React.useState<boolean>(shouldSkipToPrompts);
  const [explanationSlideStep, setExplanationSlideStep] = React.useState<number>(0);
  const [completedSteps, setCompletedSteps] = React.useState<any[]>(shouldSkipToPrompts ? [READ_PASSAGE_STEP] : []);
  const [showFocusState, setShowFocusState] = React.useState<boolean>(false);
  const [startTime, setStartTime] = React.useState<number>(Date.now());
  const [isIdle, setIsIdle] = React.useState<boolean>(false);
  const [studentHighlights, setStudentHighlights] = React.useState<any[]>([]);
  const [scrolledToEndOfPassage, setScrolledToEndOfPassage] = React.useState<boolean>(shouldSkipToPrompts);
  const [showReadTheDirectionsModal, setShowReadTheDirectionsModal] = React.useState<boolean>(false);
  const [hasStartedReadPassageStep, setHasStartedReadPassageStep] = React.useState<boolean>(shouldSkipToPrompts);
  const [hasStartedPromptSteps, setHasStartedPromptSteps] = React.useState<boolean>(shouldSkipToPrompts);
  const [doneHighlighting, setDoneHighlighting] = React.useState<boolean>(shouldSkipToPrompts);
  const [timeTracking, setTimeTracking] = React.useState<any>({
    [ONBOARDING]: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0
  });

  React.useEffect(() => {
    const activityUID = activityUID()
    const sessionFromUrl = specifiedActivitySessionUID()
    if (sessionFromUrl) {
      const fetchActiveActivitySessionArgs = {
        sessionID: sessionFromUrl,
        activityUID: activityUID,
        callback: loadPreviousSession
      }
      dispatch(getActivity(sessionFromUrl, activityUID))
        .then(() => {
          dispatch(fetchActiveActivitySession(fetchActiveActivitySessionArgs))
        })
    } else {
      if (activityUID) {
        const { sessionID, } = session
        dispatch(getActivity(sessionID, activityUID))
        dispatch(processUnfetchableSession(sessionID));
        isTurk && handlePostTurkSession(sessionID);
      }
    }

    window.addEventListener(KEYDOWN, handleKeyDown)
    window.addEventListener(MOUSEMOVE, resetTimers)
    window.addEventListener(MOUSEDOWN, resetTimers)
    window.addEventListener(CLICK, handleClick)
    window.addEventListener(KEYPRESS, resetTimers)
    window.addEventListener(VISIBILITYCHANGE, setIdle)
  }, []);

  React.useEffect(() => {
    return () => {
      window.removeEventListener(KEYDOWN, handleKeyDown)
      window.removeEventListener(MOUSEMOVE, resetTimers)
      window.removeEventListener(MOUSEDOWN, resetTimers)
      window.removeEventListener(CLICK, handleClick)
      window.removeEventListener(KEYPRESS, resetTimers)
      window.removeEventListener(VISIBILITYCHANGE, setIdle)
    };
  }, []);

  React.useEffect(() => {

    if (activities.currentActivity) { document.title = `Quill.org | ${activities.currentActivity.title}`}

    if (!outOfAttemptsForActivePrompt()) { return }

    if (!everyOtherStepCompleted(activeStep)) { return }

    completeStep(activeStep)
  }, [activities, session]);

  if (!activities.hasReceivedData) { return <LoadingSpinner /> }

  const className = `activity-container ${showFocusState ? '' : 'hide-focus-outline'} ${activeStep === READ_PASSAGE_STEP ? 'on-read-passage' : ''}`

  if(!explanationSlidesCompleted) {
    if(explanationSlideStep === 0) {
      return <WelcomeSlide onHandleClick={handleExplanationSlideClick} user={user} />
    }
    return(
      <ExplanationSlide onHandleClick={handleExplanationSlideClick} slideData={explanationData[explanationSlideStep]} />
    );
  }
  if(activityIsComplete && !window.location.href.includes('turk')) {
    return(
      <PostActivitySlide responses={session && session.submittedResponses} user={user} />
    );
  }
  return (
    <div className={className} onTouchEnd={handleReadPassageContainerTouchMoveEnd}>
      {renderStepLinksAndDirections()}
      {renderReadPassageContainer()}
      {renderRightPanel()}
    </div>
  )
}

const mapStateToProps = (state: any) => {
  return {
    activities: state.activities,
    session: state.session
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(StudentViewContainer);
