import React from 'react';
import { shallow } from 'enzyme';

import LeaveClassModal from '../leave_class_modal'

import { classroomWithStudents } from './test_data/test_data'

describe('LeaveClassModal component', () => {

  const wrapper = shallow(
    <LeaveClassModal
      close={() => {}}
      onSuccess={() => {}}
      classroom={classroomWithStudents}
    />
  );

  it('should render LeaveClassModal', () => {
    expect(wrapper).toMatchSnapshot()
  })

})
