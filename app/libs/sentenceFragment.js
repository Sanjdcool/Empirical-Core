import _ from 'underscore';
import * as qpos from './partsOfSpeechTagging';
import validEndingPunctuation from '../libs/validEndingPunctuation.js';

String.prototype.normalize = function () {
  return this.replace(/[\u201C\u201D]/g, '\u0022').replace(/[\u00B4\u0060\u2018\u2019]/g, '\u0027').replace('‚', ',');
};

function copyParentResponses(newResponse, parentResponse) {
  if (parentResponse.conceptResults) {
    newResponse.conceptResults = Object.assign({}, {}, parentResponse.conceptResults);
  }
}

export function wordLengthCount(str) {
  const strNoPunctuation = str.replace(/[^0-9a-z\s]/gi, '').replace(/\s{2,}/g, ' ').split(' ');
  return strNoPunctuation.length;
}

export default class POSMatcher {

  constructor(data) {
    this.prompt = data.prompt;
    this.responses = data.responses;
    this.questionUID = data.questionUID;
    this.wordCountChange = data.wordCountChange || {};
  }

  getOptimalResponses() {
    return _.reject(this.responses, response =>
      (response.optimal !== true) || (response.parentID)
    );
  }

  getTopOptimalResponse() {
    return _.sortBy(this.getOptimalResponses(), r => r.count).reverse()[0];
  }

  getGradedResponses() {
    // Returns sorted collection optimal first followed by suboptimal
    const gradedResponses = _.reject(this.responses, response =>
      (response.optimal === undefined) || (response.parentID)
    );
    return _.sortBy(gradedResponses, 'optimal').reverse();
  }

  checkMatch(userSubmission) {
    const formattedResponse = userSubmission.trim().replace(/\s{2,}/g, ' ');
    const returnValue = {
      found: true,
      submitted: formattedResponse,
      response: {
        text: formattedResponse,
        questionUID: this.questionUID,
        count: 1,
      },
    };
    const res = returnValue.response;

    const exactMatch = this.checkExactMatch(userSubmission);
    if (exactMatch !== undefined) {
      returnValue.response = exactMatch;
      return returnValue;
    }

    const lengthMatch = this.checkLengthMatch(userSubmission);
    if (lengthMatch !== undefined) {
      returnValue.response = Object.assign({}, res, lengthMatch);
      return returnValue;
    }

    const endingPunctuationMatch = this.checkEndingPunctuationMatch(userSubmission);
    if (endingPunctuationMatch !== undefined) {
      returnValue.response = Object.assign({}, res, endingPunctuationMatch);
      return returnValue;
    }

    const startingCapitalizationMatch = this.checkStartingCapitalization(userSubmission);
    if (startingCapitalizationMatch !== undefined) {
      returnValue.response = Object.assign({}, res, startingCapitalizationMatch);
      return returnValue;
    }

    const posMatch = this.checkPOSMatch(userSubmission);
    if (posMatch !== undefined) {
      res.author = 'Parts of Speech';
      res.feedback = posMatch.feedback;
      res.parentID = posMatch.key;
      res.optimal = posMatch.optimal;
      copyParentResponses(res, posMatch);
      return returnValue;
    }

    returnValue.found = false;
    return returnValue;
  }

  checkExactMatch(userSubmission) {
    return _.find(this.getGradedResponses(), response => response.text === userSubmission);
  }

  checkLengthMatch(userSubmission) {
    const userWordCount = wordLengthCount(userSubmission);
    console.log(this);
    const promptWordCount = wordLengthCount(this.prompt);
    const maxWordCount = promptWordCount + this.wordCountChange.max;
    const minWordCount = promptWordCount + this.wordCountChange.min;
    const templateResponse = {
      optimal: false,
      parentID: this.getTopOptimalResponse().key,
    };
    if (this.wordCountChange.min && (userWordCount < minWordCount)) {
      return Object.assign({}, templateResponse, {
        feedback: 'Too Short',
        author: 'Too Short Hint',
      });
    } else if (this.wordCountChange.max && (userWordCount > maxWordCount)) {
      return Object.assign({}, templateResponse, {
        feedback: 'Too Long',
        author: 'Too Long Hint',
      });
    }
  }

  checkEndingPunctuationMatch(userSubmission) {
    const lastChar = _.last(userSubmission);
    if (!_.includes(validEndingPunctuation, lastChar)) {
      return {
        optimal: false,
        parentID: this.getTopOptimalResponse().key,
        author: 'Ending Punctuation Hint',
        feedback: 'Proofread your sentence for missing punctuation.',
      };
    }
  }

  checkStartingCapitalization(userSubmission) {
    // Only trigger if sentence begins with a lower case letter
    if ((/^[a-z]/).test(userSubmission)) {
      return {
        optimal: false,
        parentID: this.getTopOptimalResponse().key,
        author: 'Starting Capitalization Hint',
        feedback: 'Proofread your sentence for correct capitalization.',
      };
    }
  }

  checkPOSMatch(userSubmission) {
    const correctPOSTags = this.getGradedResponses().map(
      optimalResponse => qpos.getPartsOfSpeechTags(optimalResponse.text)
    );
    const userPOSTags = qpos.getPartsOfSpeechTags(userSubmission);
    if (userPOSTags) {
      return _.find(this.getGradedResponses(), (optimalResponse, index) => {
        if (optimalResponse.parentID) {
          return false;
        } else if (correctPOSTags[index]) {
          if (JSON.stringify(correctPOSTags[index]) === JSON.stringify(userPOSTags)) {
            return true;
          }
        }
      });
    }
  }
}
