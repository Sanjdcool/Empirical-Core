# frozen_string_literal: true

class CopyConceptResultsToStudentResponsesWorker
  include Sidekiq::Worker
  sidekiq_options queue: SidekiqQueue::LOW

  def perform(concept_result_ids)
    concept_result_ids.each do |id|
      concept_result = ConceptResult.find(id)
      StudentResponse.create_from_concept_result(concept_result)
    end
  end
end
