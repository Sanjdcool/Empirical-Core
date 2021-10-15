module Evidence
  class Sequence < ApplicationRecord
    self.table_name = 'evidence_sequences'

    include Evidence::ChangeLog

    DEFAULT_CASE_SENSITIVITY = true
    MAX_REGEX_TEXT_LENGTH = 200
    CASE_SENSITIVE_ALLOWED_VALUES = [true, false]
    SEQUENCE_TYPES = [
      TYPE_INCORRECT = 'incorrect',
      TYPE_REQUIRED = 'required'
    ]

    belongs_to :sequence_group, inverse_of: :sequences

    before_validation :set_default_case_sensitivity, on: :create
    before_save :validate_regex

    validates_presence_of :sequence_group
    validates :regex_text, presence: true, length: {maximum: MAX_REGEX_TEXT_LENGTH}
    validates :case_sensitive, inclusion: CASE_SENSITIVE_ALLOWED_VALUES
    validates :sequence_type, inclusion: SEQUENCE_TYPES

    def serializable_hash(options = nil)
      options ||= {}

      super(options.reverse_merge(
        only: [:id, :sequence_group_id, :regex_text, :case_sensitive, :sequence_type]
      ))
    end

    def incorrect_sequence?
      sequence_type == TYPE_INCORRECT
    end

    def required_sequence?
      sequence_type == TYPE_REQUIRED
    end

    def regex_matches?(entry)
      string_match = case_sensitive? ? Regexp.new(regex_text).match(entry) : Regexp.new(regex_text, Regexp::IGNORECASE).match(entry)
      string_match.present?
    end

    def change_log_name
      "Regex Rule Sequence"
    end

    def url
      sequence_group.rule.url
    end

    def evidence_name
      sequence_group.rule.name
    end

    def conjunctions
      sequence_group.rule.prompts.map(&:conjunction)
    end

    private def set_default_case_sensitivity
      return if case_sensitive.in? CASE_SENSITIVE_ALLOWED_VALUES
      self.case_sensitive = DEFAULT_CASE_SENSITIVITY
    end

    private def validate_regex
      begin
        Regexp.new(regex_text)
      rescue RegexpError => e
        rule.errors.add(:invalid_regex, e.to_s)
        throw(:abort)
      end
    end

    private def log_creation
      log_change(nil, :update, self, "regex_text", nil, regex_text)
    end

    private def log_update
      if saved_change_to_regex_text?
        log_change(nil, :update, self, "regex_text", regex_text_before_last_save, regex_text)
      end
    end
  end
end
