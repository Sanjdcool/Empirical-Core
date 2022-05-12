# frozen_string_literal: true

# == Schema Information
#
# Table name: student_response_previous_feedback_texts
#
#  id         :bigint           not null, primary key
#  text       :text             not null
#  created_at :datetime         not null
#
# Indexes
#
#  index_student_response_previous_feedback_texts_on_text  (text) UNIQUE
#
require 'rails_helper'

RSpec.describe StudentResponsePreviousFeedbackText, type: :model do
  before do
    create(:student_response_previous_feedback_text)
  end

  context 'associations' do
    it { should have_many(:student_responses) }
  end

  context 'validations' do
    it { should validate_length_of(:text).is_at_least(0) }
    it { should validate_uniqueness_of(:text) }
  end
end
