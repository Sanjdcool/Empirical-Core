# frozen_string_literal: true

class CopyConceptResultsToResponsesWorker
  include Sidekiq::Worker
  sidekiq_options queue: SidekiqQueue::LOW

  BATCH_SIZE=100000

  def check_cache(cache_hash, value, table)
    return unless value
    return cache_hash[value] if cache_hash[value]

    if table == 'response_answers'
      column = 'json'
      column_type = 'jsonb'
    else
      column = 'text'
      column_type = 'text'
    end

    if value.is_a?(String)
      value = "to_json(#{ActiveRecord::Base.connection.quote(value)}::text)"
    else
      value = "'#{value.to_json.sub("'","''")}'"
    end
    result = ActiveRecord::Base.connection.execute <<-SQL
      WITH
      input_rows(#{column}, created_at) AS (
        VALUES (#{column_type} (#{value}), current_timestamp)
      ),
      insert_rows AS (
        INSERT INTO #{table} (#{column}, created_at)
        SELECT * FROM input_rows
        ON CONFLICT (#{column}) DO NOTHING
        RETURNING id
      )
      SELECT 'i' AS source, id
        FROM insert_rows
      UNION ALL
      SELECT 's' AS source, joined.id
        FROM input_rows
        JOIN #{table} AS joined
          USING (#{column})
    SQL

    cache_hash[value] = result.first['id']
  end

  def perform(start, finish)
    answers_cache = {}
    directions_cache = {}
    instructions_cache = {}
    previous_feedbacks_cache = {}
    prompts_cache = {}
    question_types_cache = {}

    Response.bulk_insert(ignore: true) do |worker|
      ConceptResult.where(id: start..finish).each do |concept_result|

        answer = concept_result.metadata['answer']
        directions = concept_result.metadata['directions']
        instructions = concept_result.metadata['instructions']
        previous_feedback = concept_result.metadata['lastFeedback']
        prompt = concept_result.metadata['prompt']
        question_type = concept_result.question_type

        extra_metadata = Response.parse_extra_metadata(concept_result.metadata)

        puts "ConceptResult: #{concept_result.id}"
        worker.add({
          attempt_number: concept_result.metadata['attemptNumber'],
          correct: concept_result.metadata['correct'] == 1,
          extra_metadata: extra_metadata,
          question_number: concept_result.metadata['questionNumber'],
          question_score: concept_result.metadata['questionScore'],
          activity_session_id: concept_result.activity_session_id,
          concept_result_id: concept_result.id,
          response_answer_id: check_cache(answers_cache, answer, 'response_answers'),
          response_diections_id: check_cache(directions_cache, directions, 'response_directions'),
          response_instructions_id: check_cache(instructions_cache, instructions, 'response_instructions'),
          response_previous_feedback_id: check_cache(previous_feedbacks_cache, previous_feedback, 'response_previous_feedbacks'),
          response_prompt_id: check_cache(prompts_cache, prompt, 'response_prompts'),
          response_question_type_id: check_cache(question_types_cache, question_type, 'response_question_types')
        })
      end
    end
  end
end
