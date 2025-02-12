import * as React from 'react';
import { shallow } from 'enzyme';

import FilterWidget from '../shared/filterWidget';

const mockProps = {
  handleFilterClick: jest.fn(),
  handleSetTurkSessionID: jest.fn(),
  onEndDateChange: jest.fn(),
  onStartDateChange: jest.fn(),
  endDate: '2021-08-03T05:00:00.000Z',
  startDate: '2021-06-29T05:00:00.000Z',
  turkSessionID: '',
  showError: jest.fn()
};

describe('FilterWidget component', () => {
  const container = shallow(<FilterWidget {...mockProps} />);

  it('should render FilterWidget', () => {
    expect(container).toMatchSnapshot();
  });
});
