# frozen_string_literal: true

module GoogleIntegration
  AUTHENTICATION_ONLY_PATH = "/auth/#{GOOGLE_AUTHENTICATION_ONLY_OPTIONS[:name]}"
  AUTHORIZATION_AND_AUTHENTICATION_PATH = "/auth/#{GOOGLE_AUTHORIZATION_AND_AUTHENTICATION_OPTIONS[:name]}"
end