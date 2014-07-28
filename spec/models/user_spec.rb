require 'spec_helper'

describe User, :type => :model do
  it 'Can auth by user or email' do
    User.create(username: 'test',          password: '123456', password_confirmation: '123456')
    User.create(email: 'test@example.com', password: '654321', password_confirmation: '654321')

    expect(User.authenticate(email: 'test',             password: '123456')).to be_truthy
    expect(User.authenticate(email: 'test@example.com', password: '654321')).to be_truthy
  end

  describe 'requires email if user is teacher' do
    before do
      @teacher = User.create(username: 'teacher_test',
                             password: 'password',
                             password_confirmation: 'password',
                             role: 'teacher')
    end
    it 'teacher should not be valid' do
      expect(@teacher).not_to be_valid
    end
  end

  describe 'requires email if no username is present' do
    describe 'teacher' do
      before do
        @teacher = User.create(password: 'password',
                               password_confirmation: 'password',
                               role: 'teacher')
      end
      it 'teacher should not be valid' do
        expect(@teacher).not_to be_valid
      end
    end

    describe 'student' do
      before do
        @student = User.create(password: 'password',
                               password_confirmation: 'password',
                               role: 'student')
      end
      it 'student should not be valid' do
        expect(@student).not_to be_valid
      end
    end
  end

  describe 'is valid if not a teacher and presented with a username' do
    before do
      @student = User.create(username: 'student_test',
                             password: 'password',
                             password_confirmation: 'password',
                             role: 'student')
    end
    it 'student should not be valid' do
      expect(@student).to be_valid
    end
  end

  it 'can set a first and last name' do
    expect(User.new(first_name: 'John').name).to eq('John')
    expect(User.new(last_name: 'Doe').name).to eq('Doe')
    expect(User.new(first_name: 'John', last_name: 'Doe').name).to eq('John Doe')
  end

  it 'requires email if a teacher' do
    expect(User.new(role: 'teacher').error_on(:email).size).to eq(1)
  end

  it 'requires email if no username present' do
    expect(User.new.error_on(:email).size).to eq(1)
  end

  it 'is ok with a username if not a teacher and presented with a username' do
    expect(User.new(username: 'john').errors_on(:email).size).to eq(0)
    expect(User.new(username: 'john', role: 'teacher').error_on(:email).size).to eq(1)
  end

  context('#generate_student') do
    let(:classroom) { Classroom.new(code: '101') }

    subject do
      student = classroom.students.build(first_name: 'John', last_name: 'Doe')
      student.generate_student
      student
    end

    describe '#username' do
      subject { super().username }
      it { is_expected.to eq('John.Doe@101') }
    end

    describe '#role' do
      subject { super().role }
      it { is_expected.to eq('student') }
    end

    it 'should authenticate with last name' do
      expect(subject.authenticate('Doe')).to be_truthy
    end
  end

  it 'checks for a password confirmation only when a password is present on update' do
    user = User.create(username: 'test', password: '123456', password_confirmation: '123456')

    expect(user.update(first_name: 'John', password: '123456', password_confirmation: '123456')).to be_truthy
    expect(User.find(user.id).update(password_confirmation: '')).to be_truthy
    expect(User.find(user.id).update(password: '', password_confirmation: '')).to be_truthy

    expect(User.find(user.id).update(password: '123', password_confirmation: '')).to be_falsey
    expect(User.find(user.id).update(password: '', password_confirmation: '123')).to be_falsey
  end

  it 'only requires a password on create' do
    expect(User.create(username: 'test')).to_not be_valid

    other_user = User.create(email: 'test@example.com', password: '654321', password_confirmation: '654321')
    expect(other_user.update(password: nil)).to be_truthy
  end

  it 'doesn\'t care about all the validation stuff when the user is temporary'
  it 'disallows regular assignment of roles that are restricted'
end
