# frozen_string_literal: true

# == Schema Information
#
# Table name: student_responses
#
#  id                                  :bigint           not null, primary key
#  attempt_number                      :integer          not null
#  correct                             :boolean          not null
#  question_number                     :integer          not null
#  created_at                          :datetime         not null
#  activity_session_id                 :bigint           not null
#  question_id                         :bigint           not null
#  student_response_answer_text_id     :bigint           not null
#  student_response_directions_text_id :bigint           not null
#  student_response_prompt_text_id     :bigint           not null
#  student_response_question_type_id   :bigint           not null
#
# Indexes
#
#  index_student_responses_on_activity_session_id                  (activity_session_id)
#  index_student_responses_on_question_id                          (question_id)
#  index_student_responses_on_student_response_answer_text_id      (student_response_answer_text_id)
#  index_student_responses_on_student_response_directions_text_id  (student_response_directions_text_id)
#  index_student_responses_on_student_response_prompt_text_id      (student_response_prompt_text_id)
#  index_student_responses_on_student_response_question_type_id    (student_response_question_type_id)
#
# Foreign Keys
#
#  fk_rails_...  (activity_session_id => activity_sessions.id)
#  fk_rails_...  (student_response_answer_text_id => student_response_answer_texts.id)
#  fk_rails_...  (student_response_directions_text_id => student_response_directions_texts.id)
#  fk_rails_...  (student_response_prompt_text_id => student_response_prompt_texts.id)
#  fk_rails_...  (student_response_question_type_id => student_response_question_types.id)
#
class StudentResponse < ApplicationRecord
  belongs_to :activity_session
  belongs_to :question
  belongs_to :student_response_answer_text
  belongs_to :student_response_directions_text
  belongs_to :student_response_prompt_text
  belongs_to :student_response_question_type

  has_one :student_response_extra_metadata

  has_many :student_responses_concepts
  has_many :concepts, through: :student_responses_concepts

  validates :correct, inclusion: {in: [true, false]}
  validates_presence_of :attempt_number, :question_number

  # This is a list of keys from the old ConceptResults records
  # that this model knows how to normalize.  Any keys that are
  # fed into create_from_metadata that aren't from this list,
  # will be stashed in a related StudentResponseExtraMetadata
  # record
  KNOWN_METADATA_KEYS = [
    :answer,
    :attemptNumber,
    :correct,
    :directions,
    :prompt,
    :questionNumber
  ]

  def self.create_from_metadata(data_hash)
    data_hash = data_hash.deep_symbolize_keys

    metadata = data_hash[:metadata]

    answer_text = StudentResponseAnswerText.find_or_create_by(text: metadata[:answer])
    directions_text = StudentResponseDirectionsText.find_or_create_by(text: metadata[:directions])
    prompt_text = StudentResponsePromptText.find_or_create_by(text: metadata[:prompt])
    question_type = StudentResponseQuestionType.find_or_create_by(text: data_hash[:question_type])

    question = calculate_question_from_hash(data_hash)

    # Make sure that singular concept_id gets converted to array of
    # conept_ids if that hasn't been done by an earlier step
    data_hash[:concept_ids] = [data_hash[:concept_id]] unless data_hash.key?(:concept_ids) && !data_hash[:concept_ids].empty?

    extra_metadata = extract_extra_metadata(metadata)

    create(
      activity_session_id: data_hash[:activity_session_id],
      concepts: data_hash[:concept_ids].uniq,
      attempt_number: metadata[:attemptNumber],
      correct: metadata[:correct],
      question: question,
      question_number: metadata[:questionNumber],
      student_response_answer_text: answer_text,
      student_response_directions_text: directions_text,
      student_response_extra_metadata: extra_metadata,
      student_response_prompt_text: prompt_text,
      student_response_question_type: question_type
    )
  end

  def self.extract_extra_metadata(metadata)
    extra_metadata = metadata.except(KNOWN_METADATA_KEYS)
    StudentResponseExtraMetadata.new(metadata: extra_metadata)
  end

  def self.bulk_create_from_metadata(data_hash_array)
    normalized_data_hash = roll_up_concepts(data_hash_array)

    normalized_data_hash.each { |data_hash| create_from_metadata(data_hash) }
  end

  # Takes an input of hashes representing old-style ConceptResult
  # and rolls them up so that a single response has only one entry
  # plus an array of concept_ids that match to it
  def self.roll_up_concepts(data_hash_array)
    data_hash_array.reduce({}) do |rollup, value|
      key = "#{value[:questionNumber]}-#{value[:attemptNumber]}"
      if rollup[key]
        rollup[key][:concept_ids].push(value[:concept_id])
      else
        rollup[key] = value.merge(concept_ids: [value[:concept_id]])
      end
    end.values
  end

  def self.calculate_question_from_hash(data_hash)
    activity_session = ActivitySession.find(data_hash[:activity_session_id])
    question_index = data_hash[:metadata][:questionNumber] - 1
    question_uid = activity_session.activity.data['questions'][question_index]['key']
    Question.find_by_uid(question_uid)
  end

  def legacy_format
    concepts.map do |concept|
      {
        id: id,
        activity_session_id: activity_session_id,
        concept_id: concept.id,
        question_type: student_response_question_type.text,
        metadata: {
          answer: student_response_answer_text.text,
          attemptNumber: attempt_number,
          correct: correct,
          directions: student_response_directions_text.text,
          prompt: student_response_prompt_text.text,
          questionNumber: question_number
        }
      }
    end
  end
end
