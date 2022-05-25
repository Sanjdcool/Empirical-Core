# frozen_string_literal: true

# == Schema Information
#
# Table name: responses
#
#  id                            :bigint           not null, primary key
#  attempt_number                :integer
#  correct                       :boolean          not null
#  question_number               :integer
#  question_score                :float
#  created_at                    :datetime         not null
#  activity_session_id           :bigint           not null
#  question_id                   :bigint
#  response_answer_id            :bigint
#  response_directions_id        :bigint
#  response_instructions_id      :bigint
#  response_previous_feedback_id :bigint
#  response_prompt_id            :bigint
#  response_question_type_id     :bigint
#
# Indexes
#
#  index_responses_on_activity_session_id            (activity_session_id)
#  index_responses_on_question_id                    (question_id)
#  index_responses_on_response_answer_id             (response_answer_id)
#  index_responses_on_response_directions_id         (response_directions_id)
#  index_responses_on_response_instructions_id       (response_instructions_id)
#  index_responses_on_response_previous_feedback_id  (response_previous_feedback_id)
#  index_responses_on_response_prompt_id             (response_prompt_id)
#  index_responses_on_response_question_type_id      (response_question_type_id)
#
# Foreign Keys
#
#  fk_rails_...  (activity_session_id => activity_sessions.id)
#  fk_rails_...  (response_answer_id => response_answers.id)
#  fk_rails_...  (response_directions_id => response_directions.id)
#  fk_rails_...  (response_instructions_id => response_instructions.id)
#  fk_rails_...  (response_previous_feedback_id => response_previous_feedbacks.id)
#  fk_rails_...  (response_prompt_id => response_prompts.id)
#  fk_rails_...  (response_question_type_id => response_question_types.id)
#
class Response < ApplicationRecord
  belongs_to :activity_session
  belongs_to :question
  belongs_to :response_answer
  belongs_to :response_directions
  belongs_to :response_instructions
  belongs_to :response_previous_feedback
  belongs_to :response_prompt
  belongs_to :response_question_type

  has_one :response_extra_metadata, dependent: :destroy

  has_many :response_concept_results, dependent: :destroy
  has_many :concept_results, through: :response_concept_results

  has_many :responses_concepts, dependent: :destroy
  has_many :concepts, through: :responses_concepts


  validates_exclusion_of :correct, in: [nil]

  # This is a list of keys from the old ConceptResults records
  # that this model knows how to normalize.  Any keys that are
  # fed into create_from_json that aren't from this list,
  # will be stashed in a related ResponseExtraMetadata
  # record
  KNOWN_METADATA_KEYS = [
    :answer,
    :attemptNumber,
    :correct,
    :directions,
    :lastFeedback,
    :prompt,
    :questionNumber,
    :questionScore
  ]

  def self.create_from_json(data_hash)
    data_hash = data_hash.deep_symbolize_keys

    metadata = data_hash[:metadata]

    question = calculate_question_from_hash(data_hash)

    # Make sure that singular concept_id gets converted to array of
    # conept_ids if that hasn't been done by an earlier step
    data_hash[:concept_ids] = [data_hash[:concept_id]] unless data_hash.key?(:concept_ids) && !data_hash[:concept_ids].empty?


    response = new(
      activity_session_id: data_hash[:activity_session_id],
      concept_ids: data_hash[:concept_ids].uniq,
      attempt_number: metadata[:attemptNumber],
      correct: metadata[:correct],
      question: question,
      question_number: metadata[:questionNumber],
      question_score: metadata[:questionScore]
    )

    response.assign_normalized_text(data_hash)
    response.assign_extra_metadata(metadata)

    response.save!
    response
  end

  def self.find_or_create_from_concept_result(concept_result)
    return if concept_result.response

    response = Response.find_by(
      activity_session: concept_result.activity_session,
      attempt_number: concept_result.metadata['attemptNumber'],
      question_number: concept_result.metadata['questionNumber']
    )

    Response.transaction do
      # Create a totally new record if there isn't one yet
      if !response
        response = create_from_json(concept_result.as_json)
      # If we have a response, but it doesn't have a the relevant
      # Concept related, add the relation.
      # This happens because old ConceptResult records do a row per Concept,
      # while we do a row per answer (using multiple ResponseConcept
      # records if there are multiple Concepts)
      elsif !response.concepts.include?(concept_result.concept)
        response.concepts.append(concept_result.concept)
      end

      # Whether we create a new record, or add a concept, we should ensure
      # that we record a relation to the source concept_result so we can
      # skip migrating it in future runs
      response.concept_results.push(concept_result) unless response.concept_results.include?(concept_result)
      response.save!
    end
    response
  end

  def legacy_format
    denormalized_per_concept = concepts.map do |concept|
      {
        id: id,
        activity_classification_id: activity_session.activity.activity_classification_id,
        activity_session_id: activity_session_id,
        concept_id: concept.id,
        question_type: response_question_type&.text,
        metadata: legacy_format_metadata
      }
    end
  end

  def assign_normalized_text(data_hash)
    metadata = data_hash[:metadata]

    self.response_answer = ResponseAnswer.find_or_create_by(json: metadata[:answer])
    self.response_directions = ResponseDirections.find_or_create_by(text: metadata[:directions])
    self.response_instructions = ResponseInstructions.find_or_create_by(text: metadata[:instructions])
    self.response_previous_feedback = ResponsePreviousFeedback.find_or_create_by(text: metadata[:lastFeedback])
    self.response_prompt = ResponsePrompt.find_or_create_by(text: metadata[:prompt])
    self.response_question_type = ResponseQuestionType.find_or_create_by(text: data_hash[:question_type])
  end

  def assign_extra_metadata(metadata)
    extra_metadata = metadata.except(*KNOWN_METADATA_KEYS).reject{ |_,v| v.nil? || (v.is_a?(Enumerable) && v.empty?) }

    return if extra_metadata.empty?

    self.response_extra_metadata = ResponseExtraMetadata.new(metadata: extra_metadata)
  end

  def self.bulk_create_from_json(data_hash_array)
    normalized_data_hash = roll_up_concepts(data_hash_array)

    normalized_data_hash.map { |data_hash| create_from_json(data_hash) }
  end

  # Takes an input of hashes representing old-style ConceptResult
  # and rolls them up so that a single response has only one entry
  # plus an array of concept_ids that match to it
  private_class_method def self.roll_up_concepts(data_hash_array)
    data_hash_array.each_with_object({}) do |value, rollup|
      key = "#{value[:metadata][:questionNumber]}-#{value[:metadata][:attemptNumber]}"
      if rollup[key]
        rollup[key][:concept_ids].push(value[:concept_id])
      else
        rollup[key] = value.merge(concept_ids: [value[:concept_id]])
      end
      rollup
    end.values

    data_hash_array
      .group_by { |v| [v[:metadata][:questionNumber], v[:metadata][:attemptNumber]] }
      .map { |_,v| v.first.merge({concept_ids: v.map { |c| c[:concept_id] }}) }
  end

  private_class_method def self.calculate_question_from_hash(data_hash)
    question_uid = data_hash[:question_uid] || data_hash[:questionUid]
    if !question_uid && data_hash[:metadata][:questionNumber]
      activity_session = ActivitySession.find(data_hash[:activity_session_id])
      question_index = data_hash[:metadata][:questionNumber] - 1
      question_uid = activity_session.activity.data['questions'][question_index]['key']
    end

    return if !question_uid

    Question.find_by_uid(question_uid)
  end

  private def legacy_format_metadata
    legacy_format_base_metadata
      .merge!(response_extra_metadata || {})
      .reject { |_,v| v.blank? }
  end

  private def legacy_format_base_metadata
    {
      answer: response_answer&.json,
      attemptNumber: attempt_number,
      correct: correct ? 1 : 0,
      directions: response_directions&.text,
      instructions: response_instructions&.text,
      lastFeedback: response_previous_feedback&.text,
      prompt: response_prompt&.text,
      questionNumber: question_number,
      questionScore: question_score
    }
  end
end
