# Include this module in any Comprehension classes that need to implement change logging behavior.

# Including this module allows a class to:
# -have many ChangeLog records (has_many, polymorphic)
# -log when the record is created
# -log when the record is updated

# For classes with the attribute 'text' defined, the module will only log changes on the text field.
# For classes without 'text' defined, the module will log all changes.

# If you need to customize logging behavior, define log_creation or log_update in the class itself
# to override default module behavior.

module Comprehension
  module ChangeLog
    extend ActiveSupport::Concern

    included do
      attr_accessor :lms_user_id
      has_many :change_logs, as: :changed_record, class_name: "::ChangeLog"
      after_create :log_creation
      after_update :log_update
    end

    def log_creation
      if attributes.key?('text')
        log_change(@lms_user_id, :create, self, "text", nil, text)
      else
        log_change(@lms_user_id, :create, self, nil, nil, nil)
      end
    end

    def log_update
      # certain callbacks cause log_update to be called on creation, so we want to return early when a record has just been created
      return if id_changed?

      if !attributes.key?('text')
        changes.except("updated_at".to_sym).each do |key, value|
          log_change(@lms_user_id, :update, self, key, value[0], value[1])
        end
      elsif text_changed?
        log_change(@lms_user_id, :update, self, "text", text_was, text)
      end
    end

    def log_change(user_id, action, changed_record, changed_attribute = nil, previous_value = nil, new_value = nil)
      change_log = {
        user_id: user_id,
        action: Comprehension.change_log_class::COMPREHENSION_ACTIONS[action],
        changed_record_type: changed_record.class.name,
        changed_record_id: changed_record.id,
        changed_attribute: changed_attribute,
        previous_value: previous_value,
        new_value: new_value
      }
      Comprehension.change_log_class.create(change_log)
    end

    def change_logs_for_activity
      @activity = Comprehension::Activity.includes(
                      :change_logs,
                      passages: [:change_logs],
                      prompts: [
                        :change_logs,
                        rules: [
                          :change_logs,
                          feedbacks:
                            [:change_logs, highlights: [:change_logs]],
                          regex_rules: [:change_logs],
                          plagiarism_text: [:change_logs]
                        ],
                      automl_models: [:change_logs]
                      ]
                    ).find(id)
      change_logs = activity_change_logs + passages_change_logs + prompts_change_logs + universal_change_logs
      change_logs.map(&:serializable_hash)
    end

    def universal_change_logs
      Comprehension::Rule.select { |r| r.universal_rule_type? }.map(&:change_logs).flatten || []
    end

    def activity_change_logs
      @activity.change_logs || []
    end

    def passages_change_logs
      @activity.passages.map(&:change_logs).flatten || []
    end

    def prompts_change_logs
      @activity.prompts.map { |prompt|
        prompt_logs = prompt.change_logs || []
        logs = prompt_logs + automl_change_logs(prompt) + rules_change_logs(prompt)
      }.flatten
    end

    def automl_change_logs(prompt)
      prompt.automl_models.map(&:change_logs).flatten || []
    end

    def rules_change_logs(prompt)
      prompt.rules.reject { |rule| rule.universal_rule_type? }.map { |rule|
        rule_logs = rule.change_logs || []
        logs = rule_logs + feedbacks_change_logs(rule) + regex_rules_change_logs(rule) + plagiarism_text_change_logs(rule)
      }.flatten! || []
    end

    def plagiarism_text_change_logs(rule)
      rule.plagiarism_text&.change_logs || []
    end

    def feedbacks_change_logs(rule)
      rule.feedbacks.map {|f|
        (f.change_logs || []) + highlights_change_logs(f)
      }.flatten! || []
    end

    def highlights_change_logs(feedback)
      feedback.highlights.map(&:change_logs).flatten! || []
    end

    def regex_rules_change_logs(rule)
      rule.regex_rules.map(&:change_logs).flatten! || []
    end
  end
end
