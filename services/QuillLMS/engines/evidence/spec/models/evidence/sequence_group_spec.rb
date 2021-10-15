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
      let!(:sequence_group) { SequenceGroup.create(:rule => (rule)) }
      let!(:sequence) { Sequence.create(:regex_text => "^test", :sequence_group=>sequence_group, :sequence_type => "required", :case_sensitive => false)}

      it 'should flag entry as failing if regex does not match and sequence type is required' do
        expect(sequence_group.entry_passing?("not test passing")).to(eq(false))
      end

      it 'should flag entry as failing if regex matches and sequence type is incorrect' do
        sequence.update(:sequence_type => "incorrect")
        expect(sequence_group.entry_passing?("test regex")).to eq false
      end

      it 'should flag entry as failing if one of two incorrect sequences matches' do
        sequence.update(:sequence_type => "incorrect")
        create(:evidence_sequence, sequence_group: sequence_group, regex_text: "^one", sequence_type: "incorrect", case_sensitive: false)
        expect(sequence_group.entry_passing?("one test")).to eq false
      end

      it 'should flag entry as passing if one of two required sequences matches' do
        sequence.update(:sequence_type => "required")
        create(:evidence_sequence, sequence_group: sequence_group, regex_text: "regex", sequence_type: "required", case_sensitive: false)
        expect(sequence_group.entry_passing?("test")).to eq true
      end

      it 'should flag entry as failing if it matches on an incorrect sequence and is missing a required sequence' do
        sequence_group.update(sequences: [])
        required_sequence = create(:evidence_sequence, sequence_group: sequence_group, regex_text: "(income|reforestation|community)", sequence_type: "required", case_sensitive: false)
        incorrect_sequence = create(:evidence_sequence, sequence_group: sequence_group, regex_text: "they collect seeds", sequence_type: "incorrect", case_sensitive: false)
        expect(sequence_group.entry_passing?("they collect seeds to do stuff")).to eq false
      end

      it 'should flag entry as passing if it matches on an incorrect sequence and matches a required sequence' do
        sequence_group.update(sequences: [])
        required_sequence = create(:evidence_sequence, sequence_group: sequence_group, regex_text: "(income|reforestation|community)", sequence_type: "required", case_sensitive: false)
        incorrect_sequence = create(:evidence_sequence, sequence_group: sequence_group, regex_text: "they collect seeds", sequence_type: "incorrect", case_sensitive: false)
        expect(sequence_group.entry_passing?("they collect seeds to promote reforestation")).to eq true
      end

      it 'should flag entry as passing if it does not match on an incorrect sequence and matches a required sequence' do
        sequence_group.update(sequences: [])
        required_sequence = create(:evidence_sequence, sequence_group: sequence_group, regex_text: "(income|reforestation|community)", sequence_type: "required", case_sensitive: false)
        incorrect_sequence = create(:evidence_sequence, sequence_group: sequence_group, regex_text: "they collect seeds", sequence_type: "incorrect", case_sensitive: false)
        expect(sequence_group.entry_passing?("they get stuff to promote reforestation")).to eq true
      end

      it 'should flag entry as failing case-insensitive if the sequence is case insensitive' do
        sequence.update(:sequence_type => "incorrect")
        expect(sequence_group.entry_passing?("TEST REGEX")).to eq false
      end

      it 'should not flag entry as failing if the sequence is case sensitive and the casing does not match' do
        sequence.update(:sequence_type => "incorrect", :case_sensitive => true)
        expect(sequence_group.entry_passing?("TEST REGEX")).to eq true
      end
    end

  end
end
