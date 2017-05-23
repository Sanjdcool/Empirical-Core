import React from 'react'
import { shallow } from 'enzyme'
import EditStudentsButton from '../EditStudentsButton.jsx'
import ButtonLoadingIndicator from '../../../../shared/button_loading_indicator'

describe('EditStudentsButton component', () => {
  const dataFuncMock = jest.fn()
  dataFuncMock.mockReturnValue = {classrooms_data: []}
  dataFuncMock.mockReturnValueOnce = {classrooms_data: []}

  describe('if it is enabled and not loading', () => {
    const buttonText = "Update Students"
    const wrapper = shallow(
      <EditStudentsButton
        enabled={true}
        buttonText={buttonText}
        dataFunc={dataFuncMock}
      />)
      wrapper.setState({loading: false})
      const handleClickMock = jest.fn()
      wrapper.instance().handleClick = handleClickMock

    it('renders one a-tag', () => {
      expect(wrapper.find('a')).toHaveLength(1)
    })

    it('renders an element with the class bg-quillgreen', () => {
      expect(wrapper.find('.bg-quillgreen')).toHaveLength(1)
    })

    it('renders the text passed to it in props.buttonText', () => {
      expect(wrapper.text()).toEqual(buttonText)
    })

    it('calls handleClick if clicked', () => {
      wrapper.find('a').simulate('click')
      expect(wrapper.instance().handleClick.mock.calls).toHaveLength(1);
    })
  })
  describe('if it is not enabled and not loading', () => {
    const disabledText = "Edit Students Before Assigning"
    const wrapper = shallow(
      <EditStudentsButton
        enabled={false}
        disabledText={disabledText}
        // dataFunc = {dataFunc}
      />)
      wrapper.setState({loading: false})

      it('renders one a-tag', () => {
        expect(wrapper.find('a')).toHaveLength(1)
      })

      it('renders an element with the class bg-lightgray', () => {
        expect(wrapper.find('.bg-lightgray')).toHaveLength(1)
      })

      it('renders the text passed to it in props.buttonText', () => {
        expect(wrapper.text()).toEqual(disabledText)
      })
  })

  describe('if it is loading', () => {
    const wrapper = shallow(
      <EditStudentsButton
        // dataFunc = {dataFunc}
      />)
      wrapper.setState({loading: true})

      it('renders one a-tag', () => {
        expect(wrapper.find('a')).toHaveLength(1)
      })

      it('renders an element with the class bg-lightgray', () => {
        expect(wrapper.find('.bg-lightgray')).toHaveLength(1)
      })

      it('renders a ButtonLoadingIndicator', () => {
        expect(wrapper.find(ButtonLoadingIndicator)).toHaveLength(1)
      })

      it('renders the text "Saving"', () => {
        expect(wrapper.text()).toContain('Saving')
      })

  })

})
