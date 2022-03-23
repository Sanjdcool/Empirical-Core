# frozen_string_literal: true

require 'sentry-ruby'
require 'sentry-rails'

Sentry.init do |config|
  config.enabled_environments = %W(staging production)
  config.send_default_pii = true
end
