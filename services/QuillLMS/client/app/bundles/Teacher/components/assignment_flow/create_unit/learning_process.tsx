import * as React from 'react'

import AssignmentFlowNavigation from '../assignment_flow_navigation'
import AssignmentCard from './assignment_card'

const allDiagnosticsSrc = `${process.env.CDN_URL}/images/illustrations/diagnostics-all.svg`
const librarySrc = `${process.env.CDN_URL}/images/illustrations/library.svg`

const selectCard = (router, link) => router.push(link)

const minis = (props) => [
  (<AssignmentCard
    bodyArray={[
      { key: 'What', text: 'Your students complete a short writing assessment, and Quill generates a unique set of practice activities for each student based on their performance.', },
      { key: 'When', text: 'You’re working with a new group of students and need data on what each student needs to practice.', }
    ]}
    header="Assess student writing with a diagnostic"
    imgAlt="page with writing and a magnifying glass over it"
    imgSrc={allDiagnosticsSrc}
    selectCard={() => selectCard(props.router, `${process.env.DEFAULT_URL}/assign/diagnostic`)}
  />),
  (<AssignmentCard
    bodyArray={[
      { key: 'What', text: 'Search our library of activities, and then select activities you would like to assign to your students.', },
      { key: 'When', text: 'You know which skills you want your students to practice, or you want to browse our materials before assigning the diagnostic.', }
    ]}
    header="Choose activities from our library"
    imgAlt="open book"
    imgSrc={librarySrc}
    selectCard={() => selectCard(props.router, `${process.env.DEFAULT_URL}/assign/activity-type`)}
  />)
];

const LearningProcess = (props) => (
  <div className="assignment-flow-container">
    <AssignmentFlowNavigation />
    <div className="learning-process container">
      <h1>Do you want to assess students' writing or choose activities first?</h1>
      <div className="minis">{minis(props)}</div>
    </div>
  </div>
);

export default LearningProcess
