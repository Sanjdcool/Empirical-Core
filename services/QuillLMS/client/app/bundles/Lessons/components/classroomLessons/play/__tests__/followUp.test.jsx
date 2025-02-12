import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';

import FollowUp from '../followUp';

import {
  SMALL_GROUP_AND_INDEPENDENT,
  PRACTICE_NOW,
  PRACTICE_LATER,
  NO_PRACTICE
} from '../../../constants'

describe('FollowUp component', () => {

  describe('when followUpOption is SMALL_GROUP_AND_INDEPENDENT', () => {
    describe('when student is flagged', () => {
      const wrapper = mount(<FollowUp followUpOption={SMALL_GROUP_AND_INDEPENDENT} followUpUrl="" isFlagged={true} /> )

      it('renders', () => {
        expect(toJson(wrapper)).toMatchSnapshot()
      })
    })

    describe('when student is not flagged', () => {
      const wrapper = mount(<FollowUp followUpOption={SMALL_GROUP_AND_INDEPENDENT} followUpUrl="" isFlagged={false} /> )

      it('renders', () => {
        expect(toJson(wrapper)).toMatchSnapshot()
      })
    })
  })

  describe('when followUpOption is PRACTICE_NOW', () => {
    const wrapper = mount(<FollowUp followUpOption={PRACTICE_NOW} followUpUrl="" /> )

    it('renders', () => {
      expect(toJson(wrapper)).toMatchSnapshot()
    })
  })

  describe('when followUpOption is PRACTICE_LATER', () => {
    const wrapper = mount(<FollowUp followUpOption={PRACTICE_LATER} followUpUrl="" /> )

    it('renders', () => {
      expect(toJson(wrapper)).toMatchSnapshot()
    })
  })

  describe('when followUpOption is NO_PRACTICE', () => {
    const wrapper = mount(<FollowUp followUpOption={NO_PRACTICE} followUpUrl="" /> )

    it('renders', () => {
      expect(toJson(wrapper)).toMatchSnapshot()
    })
  })

})
