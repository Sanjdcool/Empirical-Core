require 'newrelic_rpm'
require 'new_relic/agent'

class SessionsController < ApplicationController
  before_filter :signed_in!, only: [:destroy]
  before_filter :set_cache_buster, only: [:new]
  include ::NewRelic::Agent

  def create
    begin
      raise 'sessions/create original route still being called'
    rescue => e
      NewRelic::Agent.notice_error(e)
      errors.add(:seemingly_deprecated_route_called, "the old sessions create route was called")
    end
    params[:user][:email].downcase! unless params[:user][:email].nil?
    @user =  User.find_by_username_or_email(params[:user][:email])
    if @user.nil?
      login_failure_message
    elsif @user.signed_up_with_google
      login_failure 'You signed up with Google, please log in with Google using the link above.'
    elsif @user.password_digest.nil?
      login_failure 'Login failed. Did you sign up with Google? If so, please log in with Google using the link above.'
    elsif @user.authenticate(params[:user][:password])
      if @user.role == 'teacher'
        TestForEarnedCheckboxesWorker.perform_async(@user.id)
      end
      sign_in(@user)
      if params[:redirect].present?
        redirect_to URI.parse(params[:redirect]).path
      else
        redirect_to profile_path
      end
    else
      login_failure_message
    end
  end

  def login_through_ajax
    params[:user][:email].downcase! unless params[:user][:email].nil?
    @user =  User.find_by_username_or_email(params[:user][:email])
    if @user.nil?
      render json: {message: 'Incorrect username/email or password'}, status: 401
    elsif @user.signed_up_with_google
      render json: {message: 'You signed up with Google, please log in with Google using the link above.'}, status: 401
    elsif @user.password_digest.nil?
      render json: {message: 'Did you sign up with Google? If so, please log in with Google using the link above.'}, status: 401
    elsif @user.authenticate(params[:user][:password])
      if @user.role == 'teacher'
        TestForEarnedCheckboxesWorker.perform_async(@user.id)
      end
      sign_in(@user)
      if params[:redirect].present?
        render json: {redirect: URI.parse(params[:redirect]).path}
      else
        render json: {redirect: '/'}
      end
    else
      render json: {message: 'Incorrect username/email or password'}, status: 401
    end
  end

  def destroy
    admin_id = session.delete(:admin_id)
    admin = User.find_by_id(admin_id)
    staff_id = session.delete(:staff_id)
    if admin.present? and (admin != current_user)
      sign_out
      sign_in(admin)
      session[:staff_id] = staff_id unless staff_id.nil? # since it will be lost in sign_out
      redirect_to profile_path
    else # we must go deeper
      staff = User.find_by_id(staff_id)
      if staff.present? and (staff != current_user)
        sign_out
        sign_in(staff)
        redirect_to cms_users_path
      else
        sign_out
        redirect_to signed_out_path
      end
    end
  end

  def new
    @js_file = 'login'
    @user = User.new
    session[:role] = nil
  end

  def failure
    login_failure_message
    # redirect_to signed_out_path
  end
end
