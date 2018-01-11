require 'firebase_token_generator'
require "jwt"

class FirebaseApp < ActiveRecord::Base

  def token_for(user)
    payload = create_payload(user)
    token_generator.create_token(payload)
  end

  def connect_token_for(user)
    payload = create_connect_payload(user)
    private_key = OpenSSL::PKey::RSA.new(pkey)
    JWT.encode(payload, private_key, "RS256")
  end

  private

  def create_payload(user)
    user_id = user.present? ? user.id.to_s : 'anonymous'
    payload = {uid: "custom:#{user_id}"}

    if user.nil?
      payload[:anonymous] = true
    elsif user.staff?
      payload[:staff] = true
    elsif user.admin?
      payload[:admin] = true
    elsif user.teacher?
      payload[:teacher] = true
    elsif user.student?
      payload[:student] = true
    end
    payload
  end

  def create_connect_payload(user)
    user_id = user.present? ? user.id.to_s : 'anonymous'
    now_seconds = Time.now.to_i
    payload = {
      iss: ENV['FIREBASE_CONNECT_SERVICE_EMAIL'],
      sub: ENV['FIREBASE_CONNECT_SERVICE_EMAIL'],
      uid: "custom#{user_id}",
      aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
      iat: now_seconds,
      exp: now_seconds+(60*60), # Maximum expiration time is one hour,
      claims: {}
  }

    if user.nil?
      payload[:claims][:anonymous] = true
    elsif user.staff?
      payload[:claims][:staff] = true
    elsif user.admin?
      payload[:claims][:admin] = true
    elsif user.teacher?
      payload[:claims][:teacher] = true
    elsif user.student?
      payload[:claims][:student] = true
    end
    payload
  end

  def token_generator
    @generator ||= Firebase::FirebaseTokenGenerator.new(secret)
  end
end
