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

    def entry_failing?(entry)
      # TODO: write code here that tests all the sequences in the group and returns TRUE if the
      # entry should receive feedback
    end
  end
end
