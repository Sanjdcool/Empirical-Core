import * as React from 'react';
import 'react-dates/initialize';
import { mount } from 'enzyme';

import data from './data'

import ActivityPack from '../activity_pack';

describe('ActivityPack component', () => {
  it('renders if the current user created the unit', () => {
    const wrapper = mount(<ActivityPack data={data.ownerExampleData} getUnits={() => {}} />)
    expect(wrapper).toMatchSnapshot()
  })

  it('renders if the current user did not create the unit', () => {
    const wrapper = mount(<ActivityPack data={data.coteacherExampleData} getUnits={() => {}} />)
    expect(wrapper).toMatchSnapshot()
  })
})
