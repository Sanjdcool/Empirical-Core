import React from 'react';
import { connect } from 'react-redux';
import { hashToCollection } from '../../libs/hashToCollection';
import QuestionSelector from 'react-select-search';
import SortableList from '../questions/sortableList/sortableList.jsx';
import LandingPageEditor from './landingPageEditor.jsx';
import _ from 'underscore';

const LessonForm = React.createClass({
  getInitialState() {
    const { currentValues, } = this.props;
    return {
      name: currentValues ? currentValues.name : '',
      introURL: currentValues ? currentValues.introURL || '' : '',
      landingPageHtml: currentValues ? currentValues.landingPageHtml || '' : '',
      selectedQuestions: currentValues && currentValues.questions ? currentValues.questions : [],
      flag: currentValues ? currentValues.flag : 'Alpha',
      questionType: 'questions',
    };
  },

  submit() {
    this.props.submit({
      name: this.state.name,
      questions: this.state.selectedQuestions,
      landingPageHtml: this.state.landingPageHtml,
      flag: this.state.flag,
    });
  },

  handleStateChange(key, event) {
    const changes = {};
    changes[key] = event.target.value;
    this.setState(changes);
  },

  handleChange(value) {
    const currentSelectedQuestions = this.state.selectedQuestions;
    let newSelectedQuestions;
    const changedQuestion = currentSelectedQuestions.find(q => q.key === value);
    if (!changedQuestion) {
      newSelectedQuestions = currentSelectedQuestions.concat([{ key: value, questionType: this.state.questionType, }]);
    } else {
      newSelectedQuestions = _.without(currentSelectedQuestions, changedQuestion);
    }
    this.setState({ selectedQuestions: newSelectedQuestions, });
  },

  handleSearchChange(e) {
    this.handleChange(e.value);
  },

  sortCallback(sortInfo) {
    const newOrder = sortInfo.data.items.map(item => item.key);
    this.setState({ selectedQuestions: newOrder, });
  },

  renderQuestionSelect() {
    let questions;
    // select changes based on whether we are looking at 'questions' (should be refactored to sentenceCombining) or sentenceFragments
    if (this.state.selectedQuestions && this.state.selectedQuestions.length) {
      const questionsList = this.state.selectedQuestions.map((question) => {
        const questionobj = this.props[question.questionType].data[question.key];
        const prompt = questionobj ? questionobj.prompt : 'Question No Longer Exists';

        return (<p className="sortable-list-item" key={question.key}>
          {prompt}
          {'\t\t'}
          <button onClick={this.handleChange.bind(null, question.key)}>Delete</button>
        </p>
        );
      });
      return <SortableList key={this.state.selectedQuestions.length} sortCallback={this.sortCallback} data={questionsList} />;
    } else {
      return <div>No questions</div>;
    }
  },

  renderSearchBox() {
    // options changes based on whether we are looking at 'questions' (should be refactored to sentenceCombining) or sentenceFragments
    const questionType = this.state.questionType;
    let options = hashToCollection(this.props[questionType].data);
    const concepts = this.props.concepts.data[0];
    console.log('Options: ', options);
    if (options.length > 0) {
      options = _.filter(options, option => _.find(concepts, { uid: option.conceptID, })); // filter out questions with no valid concept
      const formatted = options.map(opt => ({ name: opt.prompt.replace(/(<([^>]+)>)/ig, '').replace(/&nbsp;/ig, ''), value: opt.key, }));
      return (<QuestionSelector
        key={questionType} options={formatted} placeholder="Search for a question"
        onChange={this.handleSearchChange}
      />);
    }
  },

  handleSelect(e) {
    this.setState({ flag: e.target.value, });
  },

  handleSelectQuestionType(e) {
    this.setState({ questionType: e.target.value, });
  },

  handleLPChange(e) {
    this.setState({ landingPageHtml: e, });
  },

  render() {
    return (
      <div className="box">
        <h4 className="title">Add New Lesson</h4>
        <p className="control">
          <label className="label">Name</label>
          <input
            className="input"
            type="text"
            placeholder="Text input"
            value={this.state.name}
            onChange={this.handleStateChange.bind(null, 'name')}
          />
        </p>
        <p className="control">
          <label className="label">Landing Page Content</label>
        </p>
        <LandingPageEditor text={this.state.landingPageHtml || ''} handleTextChange={this.handleLPChange} />
        <br />
        <p className="control">
          <label className="label">Flag</label>
          <span className="select">
            <select defaultValue={this.state.flag} onChange={this.handleSelect}>
              <option value="Alpha">Alpha</option>
              <option value="Beta">Beta</option>
              <option value="Production">Production</option>
              <option value="Archive">Archive</option>
            </select>
          </span>
        </p>
        <p className="control">
          <label className="label">Question Type</label>
          <span className="select">
            <select defaultValue={'questions'} onChange={this.handleSelectQuestionType}>
              <option value="questions">Sentence Combining</option>
              <option value="sentenceFragments">Sentence Fragment</option>
            </select>
          </span>
        </p>
        <div className="control">
          <label className="label">Currently Selected Questions -- {`Total: ${this.state.selectedQuestions.length}`}</label>
          {this.renderQuestionSelect()}
        </div>
        <label className="label">All Questions</label>
        {this.renderSearchBox()}
        <br />
        <p className="control">
          <button className={`button is-primary ${this.props.stateSpecificClass}`} onClick={this.submit}>Submit</button>
        </p>
      </div>
    );
  },
});

function select(state) {
  return {
    questions: state.questions,
    concepts: state.concepts,
    sentenceFragments: state.sentenceFragments,
  };
}

export default connect(select)(LessonForm);
