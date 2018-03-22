require 'rails_helper'

describe 'SerializeSalesContact' do
  it 'includes the contact_uid in the data' do
    teacher = create(:user, role: 'teacher')

    teacher_data = SerializeSalesContact.new(teacher.id).data

    expect(teacher_data).to include(contact_uid: teacher.id)
  end

  it 'presents teacher data' do
    teacher = create(:user,
      name: 'Pops McGee',
      role: 'teacher',
      email: 'teach@teaching.edu',
    )

    teacher_data = SerializeSalesContact.new(teacher.id).data

    expect(teacher_data[:params]).to include(
      email: 'teach@teaching.edu',
      name: 'Pops Mcgee',
      account_uid: nil,
      signed_up: teacher.created_at.to_i,
      admin: false,
      premium_status: 'NA',
      premium_expiry_date: 'NA',
      number_of_students: 0,
      number_of_completed_activities: 0,
      number_of_completed_activities_per_student: 0,
      frl: 0,
      teacher_link: "https://www.quill.org/cms/users/#{teacher.id}/sign_in",
    )
  end

  it 'presents account uid' do
    school = create(:school)
    teacher = create(:user, role: 'teacher')
    school.users << teacher

    teacher_data = SerializeSalesContact.new(teacher.id).data

    expect(teacher_data[:params]).to include(account_uid: school.id)
  end

  it 'presents admin status' do
    school = create(:school)
    teacher = create(:user, role: 'teacher')
    create(:schools_admins, school: school, user: teacher)

    teacher_data = SerializeSalesContact.new(teacher.id).data

    expect(teacher_data[:params]).to include(admin: true)
  end

  it 'presents premium status' do
    subscription = create(:subscription, account_type: 'SUPER DUPER SUB')
    teacher = create(:user, role: 'teacher')
    create(:user_subscription, subscription: subscription, user: teacher)

    teacher_data = SerializeSalesContact.new(teacher.id).data

    expect(teacher_data[:params]).to include(
      premium_status: 'SUPER DUPER SUB',
      premium_expiry_date: subscription.expiration,
    )
  end

  it 'presents student data' do
    teacher = create(:user, role: 'teacher')
    classroom = create(:classroom)
    student = create(:user, role: 'student')
    create(:classrooms_teacher, user: teacher, classroom: classroom)
    create(:students_classrooms, student: student, classroom: classroom)

    teacher_data = SerializeSalesContact.new(teacher.id).data

    expect(teacher_data[:params]).to include(
      number_of_students: 1,
      number_of_completed_activities: 0,
      number_of_completed_activities_per_student: 0,
    )
  end

  it 'presents activity data' do
    teacher = create(:user, role: 'teacher')
    classroom = create(:classroom)
    unit = create(:unit, user: teacher)
    classroom_activity = create(:classroom_activity, unit: unit)
    student = create(:user, role: 'student')
    create(:classrooms_teacher, user: teacher, classroom: classroom)
    create(:students_classrooms, student: student, classroom: classroom)
    create(:activity_session,
      classroom_activity: classroom_activity,
      state: 'finished',
    )
    create(:activity_session,
      classroom_activity: classroom_activity,
      state: 'started',
    )


    teacher_data = SerializeSalesContact.new(teacher.id).data

    expect(teacher_data[:params]).to include(
      number_of_students: 1,
      number_of_completed_activities: 1,
      number_of_completed_activities_per_student: 1,
    )
  end

  it 'presents school lunch data' do
    school = create(:school, free_lunches: 50)
    teacher = create(:user, role: 'teacher')
    school.users << teacher

    teacher_data = SerializeSalesContact.new(teacher.id).data

    expect(teacher_data[:params]).to include(frl: 50)
  end

  it 'presents teacher link' do
    teacher = create(:user, role: 'teacher')

    teacher_data = SerializeSalesContact.new(teacher.id).data

    expect(teacher_data[:params]).to include(
      teacher_link: "https://www.quill.org/cms/users/#{teacher.id}/sign_in"
    )
  end
end
