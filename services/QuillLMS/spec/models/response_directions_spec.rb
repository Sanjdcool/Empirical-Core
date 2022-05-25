# frozen_string_literal: true

# == Schema Information
#
# Table name: response_directions
#
#  id         :bigint           not null, primary key
#  text       :text             not null
#  created_at :datetime         not null
#
# Indexes
#
#  index_response_directions_on_text  (text) UNIQUE
#
require 'rails_helper'

RSpec.describe ResponseDirections, type: :model do
  before do
    create(:response_directions)
  end

  context 'associations' do
    it { should have_many(:responses) }
  end

  context 'validations' do
    it { should validate_length_of(:text).is_at_least(0) }
    it { should validate_uniqueness_of(:text) }
  end
end
