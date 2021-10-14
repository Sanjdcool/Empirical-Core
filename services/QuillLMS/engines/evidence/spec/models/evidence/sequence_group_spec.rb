require 'rails_helper'

module Evidence
  RSpec.describe(SequenceGroup, :type => :model) do

    context 'relationships' do
      it { should belong_to(:rule) }
      it { should have_many(:sequences).dependent(:destroy) }
    end

    context 'should validations' do

      it { should validate_presence_of(:rule) }

    end

    context 'should entry_failing?' do
      let!(:rule) { create(:evidence_rule) }
      let!(:regex_rule) { RegexRule.create(:rule => (rule), :regex_text => "^test", :sequence_type => "required", :case_sensitive => false) }

      # it 'should flag entry as failing if regex does not match and sequence type is required' do
      #   expect(regex_rule.entry_failing?("not test passing")).to(eq(true))
      # end

      # it 'should flag entry as failing if regex matches and sequence type is incorrect' do
      #   regex_rule.update(:sequence_type => "incorrect")
      #   expect(regex_rule.entry_failing?("test regex").to_s).to eq 'test'
      # end

      # it 'should flag entry as failing case-insensitive if the regex_rule is case insensitive' do
      #   regex_rule.update(:sequence_type => "incorrect")
      #   expect(regex_rule.entry_failing?("TEST REGEX").to_s).to eq 'TEST'
      # end

      # it 'should not flag entry as failing if the regex_rule is case sensitive and the casing does not match' do
      #   regex_rule.update(:sequence_type => "incorrect", :case_sensitive => true)
      #   expect(regex_rule.entry_failing?("TEST REGEX").to_s).to eq ''
      # end
    end

  end
end
