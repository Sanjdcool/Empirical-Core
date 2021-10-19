import * as React from "react";

import { DropdownInput, Input } from '../../../../Shared/index';
import { regexRuleSequenceOptions } from '../../../../../constants/evidence';
import { DropdownObjectInterface } from '../../../interfaces/evidenceInterfaces';
import { getSequenceType } from "../../../helpers/evidence/ruleHelpers";

const MAX_REGEX_LENGTH = 200

interface RegexRulesProps {
  errors: {},
  handleAddRegexInput: (event: React.MouseEvent) => void,
  handleAddSequenceGroupInput: (event: React.MouseEvent) => void,
  handleDeleteRegexRule: (event: React.SyntheticEvent) => void,
  handleSetRegexRule: (event: React.ChangeEvent, ruleKey?: string, sequenceIndex?: number) => void,
  handleSetRegexRuleSequence: (option: DropdownObjectInterface, ruleKey: string, sequenceIndex?: number) => void,
  regexRules: {},
  sequenceGroups: {}
}
const RegexRules = ({ errors, handleAddRegexInput, handleAddSequenceGroupInput, handleDeleteRegexRule, handleSetRegexRule, handleSetRegexRuleSequence, regexRules, sequenceGroups }: RegexRulesProps) => {

  function getInitialSequenceType (regexRule) {
    if(typeof regexRule.sequence_type === 'string') {
      return getSequenceType(regexRule.sequence_type);
    } else if(regexRule.sequence_type) {
      return regexRule.sequence_type;
    }
    return regexRuleSequenceOptions[0];
  }

  function renderRegexRules() {
    console.log("sequnce groups are")
    console.log(sequenceGroups)
    const regexRuleKeys = Object.keys(sequenceGroups);
    return !!regexRuleKeys.length && regexRuleKeys.map((ruleKey, i) => {
      if (sequenceGroups[ruleKey].length === 2) {
        const rule1 = sequenceGroups[ruleKey][0]
        const rule2 = sequenceGroups[ruleKey][1]
        const sequenceType1 = getInitialSequenceType(rule1);
        const charactersRemaining1 = MAX_REGEX_LENGTH - rule1.regex_text.length
        const sequenceType2 = getInitialSequenceType(rule2);
        const charactersRemaining2 = MAX_REGEX_LENGTH - rule2.regex_text.length
        return (
          <div className="regex-rule-container" key={`regex-rule-container-${i}`}>
            <div className="regex-input-container">
              <div className="sequence-container">
                <Input
                  className="regex-input"
                  error={errors[`Regex rule ${i + 1}`]}
                  handleChange={(e) => handleSetRegexRule(e, ruleKey, 0)}
                  id={ruleKey}
                  key={0}
                  value={sequenceGroups[ruleKey].regex_text}
                />
                <p className="characters-remaining">{charactersRemaining1} characters remaining</p>
                <div className="checkbox-container">
                  <DropdownInput
                    className='rule-type-input'
                    // eslint-disable-next-line
                    handleChange={(option) => handleSetRegexRuleSequence(option, ruleKey, 0)}
                    id={ruleKey}
                    isSearchable={true}
                    label="Sequence Type"
                    options={regexRuleSequenceOptions}
                    value={sequenceType1}
                  />
                  <label className="case-sensitive-label" htmlFor={`regex-case-sensitive-${i}`}>
                    Case Sensitive?
                  </label>
                  <input
                    aria-labelledby={ruleKey}
                    checked={regexRules[ruleKey].case_sensitive}
                    id={`regex-case-sensitive-${i}`}
                    key={0}
                    onChange={handleSetRegexRule}
                    type="checkbox"
                    value={ruleKey}
                  />
                </div>
              </div>
              <div className="sequence-container">
                <Input
                  className="regex-input"
                  error={errors[`Regex rule ${i + 1}`]}
                  handleChange={(e) => handleSetRegexRule(e, ruleKey, 1)}
                  id={ruleKey}
                  value={regexRules[ruleKey].regex_text}
                />
                <p className="characters-remaining">{charactersRemaining2} characters remaining</p>
                <div className="checkbox-container">
                  <DropdownInput
                    className='rule-type-input'
                    // eslint-disable-next-line
                    handleChange={(option) => handleSetRegexRuleSequence(option, ruleKey, 1)}
                    id={ruleKey}
                    isSearchable={true}
                    label="Sequence Type"
                    options={regexRuleSequenceOptions}
                    value={sequenceType2}
                  />
                  <label className="case-sensitive-label" htmlFor={`regex-case-sensitive-${i}`}>
                    Case Sensitive?
                  </label>
                  <input
                    aria-labelledby={ruleKey}
                    checked={sequenceGroups[ruleKey].case_sensitive}
                    id={`regex-case-sensitive-${i}`}
                    onChange={handleSetRegexRule}
                    type="checkbox"
                    value={ruleKey}
                  />
                </div>
              </div>
            </div>
            <button
              className="quill-button fun primary outlined delete-regex-button"
              id="remove-regex-button"
              onClick={handleDeleteRegexRule}
              type="button"
              value={ruleKey}
            >
              remove
            </button>
          </div>
        )
      } else {
        const rule = sequenceGroups[ruleKey][0]
        const sequenceType = getInitialSequenceType(rule);
        const charactersRemaining = MAX_REGEX_LENGTH - rule.regex_text.length
        return (
          <div className="regex-rule-container" key={`regex-rule-container-${i}`}>
            <div className="regex-input-container">
              <div className="sequence-container">
                <Input
                  className="regex-input"
                  error={errors[`Regex rule ${i + 1}`]}
                  handleChange={handleSetRegexRule}
                  id={ruleKey}
                  value={sequenceGroups[ruleKey].regex_text}
                />
                <p className="characters-remaining">{charactersRemaining} characters remaining</p>
                <div className="checkbox-container">
                  <DropdownInput
                    className='rule-type-input'
                    // eslint-disable-next-line
                    handleChange={(option) => handleSetRegexRuleSequence(option, ruleKey)}
                    id={ruleKey}
                    isSearchable={true}
                    label="Sequence Type"
                    options={regexRuleSequenceOptions}
                    value={sequenceType}
                  />
                  <label className="case-sensitive-label" htmlFor={`regex-case-sensitive-${i}`}>
                    Case Sensitive?
                  </label>
                  <input
                    aria-labelledby={ruleKey}
                    checked={regexRules[ruleKey].case_sensitive}
                    id={`regex-case-sensitive-${i}`}
                    onChange={handleSetRegexRule}
                    type="checkbox"
                    value={ruleKey}
                  />
                </div>
              </div>
            </div>
            <button
              className="quill-button fun primary outlined delete-regex-button"
              id="remove-regex-button"
              onClick={handleDeleteRegexRule}
              type="button"
              value={ruleKey}
            >
              remove
            </button>
          </div>
        )
      }
    });
  }
  return(
    <div className="regex-rules-container">
      {renderRegexRules()}
      <div className="add-sequences-buttons-container">
        <button
          className="quill-button fun primary outlined add-regex-button"
          id="add-regex-button"
          onClick={handleAddSequenceGroupInput}
          type="button"
        >
          Add Dual-Sequence Group +
        </button>
        <button
          className="quill-button fun primary outlined add-regex-button"
          id="add-regex-button"
          onClick={handleAddRegexInput}
          type="button"
        >
          Add Single-Sequence Group +
        </button>
      </div>
    </div>
  )
}

export default RegexRules
