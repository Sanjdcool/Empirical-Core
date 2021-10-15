module Evidence
  class SequenceGroup < ApplicationRecord
    self.table_name = 'evidence_sequence_groups'

    belongs_to :rule, inverse_of: :sequence_groups
    has_many :sequences, inverse_of: :sequence_group, dependent: :destroy

    validates_presence_of :rule

    def serializable_hash(options = nil)
      options ||= {}

      super(options.reverse_merge(
        only: [:id, :rule_id]
      ))
    end

    def has_dual_sequences?
      sequences.count > 1
    end

    def has_single_required_sequence?
      sequences.count == 1 && sequences.first.required_sequence?
    end

    def has_single_incorrect_sequence?
      sequences.count == 1 && sequences.first.incorrect_sequence?
    end

    def entry_passing?(entry)
      incorrect_sequences_passing = true
      required_sequences_passing = true
      if sequences.where(sequence_type: Sequence::TYPE_INCORRECT).any?
        incorrect_sequences_passing = sequences.where(sequence_type: Sequence::TYPE_INCORRECT).none? {|s| s.regex_matches?(entry)}
      end
      if sequences.where(sequence_type: Sequence::TYPE_REQUIRED).any?
        required_sequences_passing =  sequences.where(sequence_type: Sequence::TYPE_REQUIRED).any? {|s| s.regex_matches?(entry)}
        incorrect_sequences_passing = true if required_sequences_passing
      end
      return incorrect_sequences_passing && required_sequences_passing
    end
  end
end
