declare function require(name:string);
const request = require('request-promise');
// import AWS from 'aws-sdk'
import * as _ from 'underscore';
import { hashToCollection } from 'quill-component-library/dist/componentLibrary';

// const qml = require('quill-marking-logic')
import { checkSentenceCombining, checkSentenceFragment, checkDiagnosticQuestion, checkFillInTheBlankQuestion, ConceptResult } from 'quill-marking-logic'
import objectWithSnakeKeysFromCamel from '../objectWithSnakeKeysFromCamel';

// AWS.config.update({ region:'us-east-1', accessKeyId: 'akid', secretAccessKey: 'secret' });

interface Question {
  conceptID: string,
  cues: Array<string>,
  flag: string,
  focusPoints: FocusPoints,
  incorrectSequences: Array<IncorrectSequence>,
  instructions: string,
  itemLevel: string,
  prefilledText: string,
  prompt: string,
  key?: string,
  wordCountChange?:object,
  ignoreCaseAndPunc?:Boolean,
  modelConceptUID?: string
}

interface FocusPoints {
  [key:string]: FocusPoint
}

interface FocusPoint {
  feedback: string,
  text: string,
  order?: string
}

interface IncorrectSequence {
  conceptResults: ConceptResults,
  feedback: string,
  text: string
}

interface ConceptResults {
  [key:string]: ConceptResult
}

// interface ConceptResult {
//   conceptUID: string,
//   correct: Boolean,
//   name: string
// }

export function rematchAll(mode: string, questionID: string, callback:Function) {
  let type
  if (mode === 'sentenceFragments') {
    type = 'diagnostic_sentenceFragments';
  } else if (mode === 'diagnosticQuestions' || mode === 'questions') {
    type = 'diagnostic_questions';
  } else if (mode === 'fillInBlank') {
    type = 'diagnostic_fillInBlankQuestions';
  }
  request.post({
      url: 'https://p8147zy7qj.execute-api.us-east-1.amazonaws.com/prod',
      json: {type, uid: questionID},
    },
    (error, httpStatus, body) => {
      debugger;
      if (error) {
        console.log('error', error)
      } else if (httpStatus.statusCode === 204 || httpStatus.statusCode === 200) {
        console.log('success');
        debugger;
      } else {
        console.log(body);
      }
    },
  );

  // https://p8147zy7qj.execute-api.us-east-1.amazonaws.com/prod
  // const matcher = getMatcher(mode);
  // getGradedResponses(questionID).then((data) => {
  //   question.key = questionID
  //   const matcherFields = getMatcherFields(mode, question, formatGradedResponses(data));
  //   paginatedNonHumanResponses(matcher, matcherFields, questionID, 1, callback);
  // });
}

export function rematchOne(response: string, mode: string, question: Question, questionID: string, callback:Function) {
  const matcher = getMatcher(mode);
  getGradedResponses(questionID).then((data) => {
    question.key = questionID
    const matcherFields = getMatcherFields(mode, question, formatGradedResponses(data));
    const promise = rematchResponse(matcher, matcherFields, response);
    if (promise) {
      promise.then(() => { callback(); });
    }
  });
}

export function paginatedNonHumanResponses(matcher, matcherFields, qid, page, callback) {

  return request(
    {
      uri: `https://cms.quill.org/questions/${qid}/responses/search`,
      method: 'POST',
      body: getResponseBody(page),
      json: true,
    },
  ).then((data) => {
    const parsedResponses = _.indexBy(data.results, 'id');
    const responseData = {
      responses: parsedResponses,
      numberOfResponses: data.numberOfResults,
      numberOfPages: data.numberOfPages,
    };
    const rematchedResponses = rematchResponses(matcher, matcherFields, responseData.responses);
    if (page < data.numberOfPages) {
      callback({ progress: Math.round(page / data.numberOfPages * 100), });
      return paginatedNonHumanResponses(matcher, matcherFields, qid, page + 1, callback);
    }
    callback({ progress: undefined, }, true);
  }).catch((err) => {
    console.log(err);
  });
}

function rematchResponses(matcher, matcherFields, responses) {
  _.each(hashToCollection(responses), (response) => {
    rematchResponse(matcher, matcherFields, response);
  });
}

function rematchResponse(matcher, matcherFields, response) {
  let newResponse, fieldsWithResponse;
  if (Array.isArray(matcherFields)) {
    fieldsWithResponse = [...matcherFields]
    fieldsWithResponse.splice(1, 0, response.text)
    newResponse = {response: matcher.apply(null, fieldsWithResponse) };
  } else {
    fieldsWithResponse = {...matcherFields, response: response.text}
    newResponse = {response: matcher(fieldsWithResponse)};
  }

  const delta = determineDelta(response, newResponse);
  // console.log(response.id, response.text, delta);
  switch (delta) {
    case 'tobeunmatched':
      return unmatchRematchedResponse(response);
    case 'tobeupdated':
      return updateRematchedResponse(response, newResponse);
    default:
      return false;
  }
}

function unmatchRematchedResponse(response) {
  const newVals = {
    weak: false,
    feedback: null,
    parent_id: null,
    text: response.text,
    count: response.count,
    question_uid: response.question_uid,
  };
  return updateResponse(response.id, newVals);
}

function updateRematchedResponse(response, newResponse) {
  const newVals = {
    weak: false,
    parent_id: newResponse.response.parent_id,
    author: newResponse.response.author,
    feedback: newResponse.response.feedback,
    concept_results: convertResponsesArrayToHash(newResponse.response.concept_results),
  };
  return updateResponse(response.id, newVals);
}

function deleteRematchedResponse(response) {
  // deleteResponse(rid);
  console.log('Should be deleted');
}

function updateResponse(rid, content) {
  const rubyConvertedResponse = objectWithSnakeKeysFromCamel(content, false);
  return request({
    method: 'PUT',
    uri: `https://cms.quill.org/responses/${rid}`,
    body: { response: rubyConvertedResponse, },
    json: true,
  });
}

function determineDelta(response, newResponse) {
  const unmatched = !newResponse.response.author && !!response.author;
  const parentIDChanged = (newResponse.response.parent_id? Number(newResponse.response.parent_id) : null) !== response.parent_id;
  const authorChanged = newResponse.response.author !== response.author;
  const feedbackChanged = newResponse.response.feedback !== response.feedback;
  const conceptResultsChanged = _.isEqual(convertResponsesArrayToHash(newResponse.response.concept_results), response.concept_results);
  const changed = parentIDChanged || authorChanged || feedbackChanged || conceptResultsChanged;
  // console.log(response.id, parentIDChanged, authorChanged, feedbackChanged, conceptResultsChanged);
  // console.log(response, newResponse.response);
  if (changed) {
    if (unmatched) {
      return 'tobeunmatched';
    }
    return 'tobeupdated';
  }
  return 'unchanged';
}

function saveResponses(responses) {
  return responses;
}

function getMatcher(mode:string):Function {
  if (mode === 'sentenceFragments') {
    return checkSentenceFragment;
  } else if (mode === 'diagnosticQuestions') {
    return checkDiagnosticQuestion;
  } else if (mode === 'fillInBlank') {
    return checkFillInTheBlankQuestion;
  }
  return checkSentenceCombining;
}

function getMatcherFields(mode:string, question:Question, responses:{[key:string]: Response}) {

  const responseArray = hashToCollection(responses);
  const focusPoints = question.focusPoints ? hashToCollection(question.focusPoints) : [];
  const incorrectSequences = question.incorrectSequences ? hashToCollection(question.incorrectSequences) : [];
  const defaultConceptUID = question.modelConceptUID || question.conceptID

  if (mode === 'sentenceFragments') {
    return {
      wordCountChange: question.wordCountChange,
      question_uid: question.key,
      prompt: question.prompt,
      responses: responseArray,
      focusPoints: focusPoints,
      incorrectSequences: incorrectSequences,
      ignoreCaseAndPunc: question.ignoreCaseAndPunc,
      checkML: true,
      mlUrl: process.env.CMS_URL,
      defaultConceptUID
    };
  } else if (mode === 'diagnosticQuestions') {
    return [question.key, hashToCollection(responses), defaultConceptUID]
  } else if (mode === 'fillInBlank') {
    return [question.key, hashToCollection(responses), defaultConceptUID]
  } else {
    return [question.key, responseArray, focusPoints, incorrectSequences, defaultConceptUID]
  }
}


function getResponseBody(pageNumber) {
  return {
    search: {
      filters: {
        author: [],
        status: [0, 1],
      },
      pageNumber,
      sort: {
        column: 'count',
        direction: 'desc',
      },
      text: '',
    },
  };
}

function getGradedResponses(questionID) {
  return request(`${process.env.QUILL_CMS}/questions/${questionID}/responses`);
}

function formatGradedResponses(jsonString):{[key:string]: Response} {
  const bodyToObj = {};
  JSON.parse(jsonString).forEach((resp) => {
    bodyToObj[resp.id] = resp;
    if (typeof resp.concept_results === 'string') {
      resp.concept_results = JSON.parse(resp.concept_results);
    }
    for (const cr in resp.concept_results) {
      if (resp.concept_results.hasOwnProperty(cr)) {
        const formattedCr:any = {};
        formattedCr.conceptUID = cr;
        formattedCr.correct = resp.concept_results[cr];
        resp.concept_results[cr] = formattedCr;
      }
    }
    resp.conceptResults = resp.concept_results;
    delete resp.concept_results;
  });
  return bodyToObj;
}

function convertResponsesArrayToHash(crArray) {
  const crs = _.values(crArray);
  const newHash = {};
  _.each(crs, (val) => {
    if (val.conceptUID && val.conceptUID.length > 0) {
      newHash[val.conceptUID] = val.correct;
    }
  });
  return newHash;
}
