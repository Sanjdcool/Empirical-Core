import * as React from "react"
import ReactHtmlParser from 'react-html-parser'

import { onMobile, orderedSteps, everyOtherStepCompleted, addPTagsToPassages, READ_PASSAGE_STEP } from './containerActionHelpers'

import DirectionsSectionAndModal from '../components/studentView/directionsSectionAndModal'
import PromptStep from '../components/studentView/promptStep'
import HeaderImage from '../components/studentView/headerImage'

const bigCheckSrc =  `${process.env.CDN_URL}/images/icons/check-circle-big.svg`

export const renderDirectionsSectionAndModal = ({ className, closeReadTheDirectionsModal, activeStep, doneHighlighting, showReadTheDirectionsModal, activities }) => {
  const { currentActivity, } = activities

  return  (<DirectionsSectionAndModal
    activeStep={activeStep}
    className={className}
    closeReadTheDirectionsModal={closeReadTheDirectionsModal}
    inReflection={activeStep === READ_PASSAGE_STEP && doneHighlighting}
    passage={currentActivity.passages[0]}
    showReadTheDirectionsModal={showReadTheDirectionsModal}
  />)
}

export const renderDirections = ({ closeReadTheDirectionsModal, activeStep, doneHighlighting, showReadTheDirectionsModal, activities, hasStartedReadPassageStep, hasStartedPromptSteps }) => {
  const { currentActivity, } = activities

  const directionsSectionAndModal = renderDirectionsSectionAndModal({ className: '', closeReadTheDirectionsModal , activeStep, doneHighlighting, showReadTheDirectionsModal, activities })

  if ((!hasStartedReadPassageStep || (activeStep > READ_PASSAGE_STEP && !hasStartedPromptSteps)) && onMobile()) {
    return
  }

  if (!currentActivity || activeStep === READ_PASSAGE_STEP) {
    return (<div className="hide-on-desktop step-links-and-directions-container">{directionsSectionAndModal}</div>)
  }
}

export const renderStepNumber = (number: number, activeStep, completedSteps) => {
  const active = activeStep === number
  const completed = completedSteps.includes(number)
  if (completed) {
    return <img alt="white check in green circle" className="step-number completed" key={number} src={bigCheckSrc} />
  }
  // we have to remove one step for display because there are actually four steps including read passage, but it's displayed differently
  return <div className={`step-number ${active ? 'active' : ''}`} key={number}>{number - 1}</div>
}

export const renderReadPassageStep = (activeStep, activities, handleDoneReadingClick) => {
  const { currentActivity, } = activities
  if (!currentActivity || activeStep !== READ_PASSAGE_STEP) { return }

  return (<div className='read-passage-step-container'>
    <h2>Read the text.</h2>
    <button className='quill-button large primary contained done-reading-button' onClick={handleDoneReadingClick} type="button">Done reading</button>
  </div>)
}

export const renderPromptStep = ({
  activateStep,
  activityIsComplete,
  completionButtonCallback,
  completeStep,
  submitResponse,
  closeReadTheDirectionsModal,
  activities,
  session,
  activeStep,
  completedSteps,
  doneHighlighting,
  showReadTheDirectionsModal,
  reportAProblem,
}) => {
  const { currentActivity, } = activities
  const { submittedResponses, hasReceivedData, } = session

  if (!currentActivity || !hasReceivedData) return

  // the first step is reading, so we will always start at 2 and therefore want to begin at the 0 index
  const stepNumber = activeStep - 2;
  const prompts = orderedSteps(activities);
  const prompt = prompts[stepNumber];

  return (<div className="prompt-steps">
    {renderDirectionsSectionAndModal({ className: '', closeReadTheDirectionsModal, activeStep, doneHighlighting, showReadTheDirectionsModal, activities })}
    <PromptStep
      activateStep={activateStep}
      activityIsComplete={activityIsComplete}
      className="step active"
      completeStep={completeStep}
      completionButtonCallback={completionButtonCallback}
      everyOtherStepCompleted={everyOtherStepCompleted(activeStep, completedSteps)}
      key={activeStep}
      prompt={prompt}
      reportAProblem={reportAProblem}
      stepNumber={activeStep}
      submitResponse={submitResponse}
      submittedResponses={(submittedResponses && submittedResponses[prompt.id]) || []}
    />
  </div>)
}

export const renderReadPassageContainer = ({
  activities,
  activeStep,
  handleReadPassageContainerScroll,
  hasStartedPromptSteps,
  hasStartedReadPassageStep,
  scrolledToEndOfPassage,
  showReadTheDirectionsModal,
  transformMarkTags
 }) => {
  const { currentActivity, } = activities
  if (!currentActivity) { return }

  const { title, passages, } = currentActivity
  const headerImage = passages[0].image_link && <img alt={passages[0].image_alt_text} className="header-image" src={passages[0].image_link} />
  let innerContainerClassName = "read-passage-inner-container "
  innerContainerClassName += !hasStartedReadPassageStep || showReadTheDirectionsModal || (activeStep > READ_PASSAGE_STEP && !hasStartedPromptSteps) ? 'blur' : ''

  if ((!hasStartedReadPassageStep || (activeStep > READ_PASSAGE_STEP && !hasStartedPromptSteps)) && onMobile()) {
    return
  }
  const formattedPassages = addPTagsToPassages(passages, scrolledToEndOfPassage)
  const formattedPassage = formattedPassages ? formattedPassages[0] : '';
  return (<div className="read-passage-container" onScroll={handleReadPassageContainerScroll}>
    <div className={innerContainerClassName}>
      <h1 className="title">{title}</h1>
      <HeaderImage headerImage={headerImage} passage={passages[0]} />
      <div className="passage">{ReactHtmlParser(formattedPassage, { transform: transformMarkTags })}</div>
    </div>
  </div>)
}
