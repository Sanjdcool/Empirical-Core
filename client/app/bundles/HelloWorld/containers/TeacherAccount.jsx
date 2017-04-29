'use strict'
import React from 'react';
import SelectRole from '../components/accounts/edit/select_role';
import UserSelectRole from '../components/accounts/edit/user_accessible_select_role.jsx';
import SelectSubscription from '../components/accounts/subscriptions/select_subscription';
import StaticDisplaySubscription from '../components/accounts/subscriptions/static_display_subscription';
import SelectSchool from '../components/accounts/school/select_school';
import $ from 'jquery';
import LoadingSpinner from '../components/shared/loading_indicator.jsx'


export default React.createClass({
	propTypes: {
		userType: React.PropTypes.string.isRequired,
	},

	getInitialState: function() {
		return ({
			id: this.props.teacherId,
			name: '',
			username: '',
			email: '',
			isSaving: false,
			selectedSchool: null,
			originalSelectedSchool: null,
			schoolOptions: [],
			schoolOptionsDoNotApply: false,
			role: 'teacher',
			password: null,
			loading: true,
			errors: {},
			subscription: {
				id: null,
				expiration: '2016-01-01',
				account_limit: null
			}
		});
	},
	componentDidMount: function() {
		var url,
			data;
		if (this.props.userType == 'staff') {
			url = '/cms/users/' + this.props.teacherId + '/show_json'
		} else {
			url = '/teachers/my_account_data';
		}
		$.ajax({url: url, success: this.populateData});
	},
	populateData: function(data) {
		var school,
			schoolData,
			originalSelectedSchoolId;
		school = data.schools[0];
		if (school == null) {
			schoolData = null;
			originalSelectedSchoolId = null;
		} else {
			schoolData = {
				id: school.id,
				text: school.name,
				zipcode: school.zipcode
			};
			originalSelectedSchoolId = school.id;
			this.requestSchools(school.zipcode);
			// couldnt get react to re-render the default value of zipcode based on state change so have to use the below
			$('input.zip-input').val(school.zipcode);
		}
		let subscription
		if (data.subscription) {
			subscription = data.subscription
		} else {
			subscription = {
				id: null,
				expiration: '2016-01-01',
				account_limit: null,
				account_type: 'none',
				subscriptionType: 'none'
			};
		}
		this.setState({
			id: data.id,
			name: data.name,
			username: data.username,
			email: data.email,
			role: data.role,
			googleId: data.google_id,
			signedUpWithGoogle: data.signed_up_with_google,
			selectedSchool: schoolData,
			originalSelectedSchoolId: originalSelectedSchoolId,
			schoolOptionsDoNotApply: (originalSelectedSchoolId == null),
			subscription: subscription,
			loading: false
		});
	},
	displayHeader: function() {
		var str = this.state.name;
		var str2 = str + '\'s Account';
		return str2;
	},
	updateName: function(event) {
		this.setState({name: event.target.value});
	},
	updateUsername: function(event) {
		this.setState({username: event.target.value});
	},
	updateEmail: function(event) {
		this.setState({email: event.target.value});
	},
	determineSaveButtonClass: function() {
		var className;
		if (this.state.isSaving) {
			className = 'button-grey';
		} else {
			className = 'button-green';
		}
		return className;
	},
	clickSave: function() {
		this.setState({isSaving: true});
		var data = {
			name: this.state.name,
			authenticity_token: $('meta[name=csrf-token]').attr('content'),
			username: this.state.username,
			email: this.state.email,
			role: this.state.role,
			password: this.state.password,
			school_id: ((this.state.selectedSchool == null)
				? null
				: this.state.selectedSchool.id),
			original_selected_school_id: this.state.originalSelectedSchoolId,
			school_options_do_not_apply: this.state.schoolOptionsDoNotApply
		}
		var url;
		if (this.props.userType == 'staff') {
			url = '/cms/users/' + this.props.teacherId;
		} else if (this.props.userType == 'teacher') {
			url = '/teachers/update_my_account';
		}
		$.ajax({type: 'PUT', data: data, url: url, success: this.uponUpdateAttempt});
	},

	uponUpdateAttempt: function(data) {
		this.setState({isSaving: false});
		if (data.errors == null) {
			// name may have been capitalized on back-end
			data.errors = {};
			if (this.props.userType == 'staff') {
				this.saveSubscription();
			} else if (this.state.role === 'student') {
				window.location = '/profile'
			}
		}
		this.setState({errors: data.errors});
	},

	saveSubscription: function() {
		if (this.state.subscription.account_type == 'none') {
			if (this.state.subscription.id != null) {
				this.destroySubscription()
			}
		} else if (this.state.subscription.account_type == 'paid' || 'trial' || 'free low-income' || 'free contributor') {
			if (this.state.subscription.id == null) {
				this.createSubscription();
			} else {
				this.updateSubscription();
			}
		}
	},
	createSubscription: function() {
		var sub = Object.assign({}, this.state.subscription)
    delete sub.subscriptionType;
		sub.user_id = this.props.teacherId
		$.ajax({type: 'POST', url: '/subscriptions', data: sub, success: alert('saved!')});
	},

	updateSubscription: function() {
		$.ajax({
			type: 'PUT',
			url: '/subscriptions/' + this.state.subscription.id,
			data: {
				expiration: this.state.subscription.expiration,
				account_limit: this.state.subscription.account_limit,
				account_type: this.state.subscription.account_type || this.state.account_type
			},
			success: alert('saved!')
		})
	},

	destroySubscription: function() {
		var that = this;
		$.ajax({
			type: 'DELETE',
			// not sure why, but strong params are blocking me from sending the
			data: {
				account_type: this.state.subscription.account_type
			},
			url: '/subscriptions/' + this.state.subscription.id
		}).done(function() {
			var subscription = {
				id: null,
				account_limit: null,
				expiration: null
			}
			that.setState({subscription: subscription});
		});
	},
	updateSubscriptionState: function(subscription) {
		this.setState({subscription: subscription});
	},
	updateSubscriptionType: function(type) {
		var new_sub = Object.assign({}, this.state.subscription)
		new_sub.account_type = type;
		new_sub.subscriptionType = type;
		this.setState({subscription: new_sub});
	},
	updateSchool: function(school) {
		this.setState({selectedSchool: school});
	},
	requestSchools: function(zip) {
		$.ajax({
			url: '/schools.json',
			data: {
				zipcode: zip
			},
			success: this.populateSchools
		});
	},
	populateSchools: function(data) {
		this.setState({schoolOptions: data});
	},
	attemptDeleteAccount: function() {
		var confirmed = confirm('Are you sure you want to delete this account?');
		if (confirmed) {
			$.ajax({
				type: 'POST',
				url: `/teachers/clear_data/${this.state.id}`,
				data: {
					id: this.props.teacherId
				}
			}).done(function() {
				window.location.href = window.location.origin;
			});
		}
	},
	updateSchoolOptionsDoNotApply: function() {
		this.setState({schoolOptionsDoNotApply: !this.state.schoolOptionsDoNotApply}, () => this.updateSelectedSchool());
	},
	updateSelectedSchool: function() {
		if (this.state.schoolOptionsDoNotApply) {
			this.setState({
				selectedSchool: {
					id: 103341,
					zipcode: null,
					name: 'not listed'
				}
			})
		}
	},
	updatePassword: function(e) {
		this.setState({password: e.target.value});
	},
	updateRole: function(role) {
		this.setState({role: role});
	},
	render: function() {
		if (this.state.loading) {
			return <LoadingSpinner/>
		}
		let selectRole, subscription, showEmail
			subscription;
		if (this.props.userType == 'staff') {
			selectRole = <SelectRole role={this.state.role} updateRole={this.updateRole} errors={this.state.errors.role}/>
			subscription = <SelectSubscription subscription={this.state.subscription} updateSubscriptionType={this.updateSubscriptionType} updateSubscriptionState={this.updateSubscriptionState}/>
		} else {
			selectRole = <UserSelectRole role={this.state.role || 'teacher'} updateRole={this.updateRole}/>
			subscription = <StaticDisplaySubscription subscription={this.state.subscription}/>
		}

		// TODO deprecate signedUpWithGoogle - need it here for now
		if (this.state.googleId || this.state.signedUpWithGoogle) {
			if (this.props.userType == 'staff') {
				showEmail = <div className='row'>
											<div className='form-label col-xs-2'>
												Email
											</div>
											<div className='col-xs-4'>
												<input className="inactive" ref='email' value={this.state.email} readOnly/>
											</div>
											<div className='col-xs-4 error'>
												<span>This is a Google Classroom user, so changing their email here will break their account. Have a dev do it.</span>
											</div>
										</div>
			}
		} else {
			showEmail = <div className='row'>
										<div className='form-label col-xs-2'>
											Email
										</div>
										<div className='col-xs-4'>
											<input ref='email' onChange={this.updateEmail} value={this.state.email}/>
										</div>
										<div className='col-xs-4 error'>
											{this.state.errors.email}
										</div>
									</div>
		}



		return (
			<div className='container' id='my-account'>
				<div className='row'>
					<div className='col-xs-12'>
						<div className='row'>
							<h3 className='form-header col-xs-12'>
								{this.displayHeader()}
							</h3>
						</div>
						<div className='row'>
							<div className='form-label col-xs-2'>
								Full Name
							</div>
							<div className='col-xs-4'>
								<input ref='name' onChange={this.updateName} value={this.state.name}/>
							</div>
							<div className='col-xs-4 error'>
								{this.state.errors.name}
							</div>
						</div>
						<div className='row'>
							<div className='form-label col-xs-2'>
								Username
							</div>
							<div className='col-xs-4'>
								<input ref='username' onChange={this.updateUsername} value={this.state.username}/>
							</div>
							<div className='col-xs-4 error'>
								{this.state.errors.username}
							</div>
						</div>

						{selectRole}

						{showEmail}

						<div className='row'>
							<div className='form-label col-xs-2'>
								Password
							</div>
							<div className='col-xs-4'>
								<input type='password' ref='password' onChange={this.updatePassword} placeholder="Input New Password"/>
							</div>
							<div className='col-xs-4 error'>
								{this.state.errors.password}
							</div>
						</div>
						<SelectSchool errors={this.state.errors.school} selectedSchool={this.state.selectedSchool} schoolOptions={this.state.schoolOptions} requestSchools={this.requestSchools} updateSchool={this.updateSchool}/>

						<div className='row school-checkbox'>
							<div className='form-label col-xs-2'></div>
							<div className='col-xs-1 no-pr'>
								<input ref='schoolOptionsDoNotApply' onChange={this.updateSchoolOptionsDoNotApply} type='checkbox' checked={this.state.schoolOptionsDoNotApply}/>
							</div>
							<div className='col-xs-6 no-pl form-label checkbox-label'>
								My school is not listed.
							</div>
						</div>

						{subscription}

						<div className='row'>
							<div className='col-xs-2'></div>
							<div className='col-xs-4'>
								<button onClick={this.clickSave} className={this.determineSaveButtonClass()}>Save Changes</button>
							</div>
						</div>

						<div className='row'>
							<div className='col-xs-2'></div>
							<div onClick={this.attemptDeleteAccount} className='col-xs-2 delete-account'>
								Delete Account
							</div>
						</div>

					</div>
				</div>
			</div>
		);
	}
});
