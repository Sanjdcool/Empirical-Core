class AmplifyReportActivityWorker
  include Sidekiq::Worker

  def perform(amplify_session_id, activity_name, description, score, activity_url, results_url)
    @payload = generate_payload(amplify_session_id, activity_name, description, score, activity_url, results_url)
    submit_payload_to_amplify(@payload)
  end

  def generate_payload(amplify_session_id, activity_name, description, score, activity_url, results_url)
    return {
      "amplify_user_id" => amplify_session_id,
      "quill_activity_name" => activity_name,
      "quill_activity_description" => description,
      "score" => score,
      "activity_url" => activity_url,
      "results_url" => results_url
    }
  end

  def submit_payload_to_amplify(payload)
    # Do some sort of HTTP request here instead of logging
    logger.debug(payload)
  end

end
