import 'whatwg-fetch'
import React from 'react';
import { Provider } from 'react-redux'
import createStore from '../../../utils/configureStore';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import Lesson from '../lessons'

describe('Lesson component', () => {

  const store = createStore();
  const props = {lessons: {
    hasreceiveddata: false,
    submittingnew: false,
    states: {},
    data: {},
  }}

  const wrapper = shallow(<Provider store={store}><Lesson props={props} /></Provider>)
  it('matches the snapshot', () => {
    expect(toJson(wrapper)).toMatchSnapshot()
  })
})
