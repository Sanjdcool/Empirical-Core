class ClassroomsTeacher < ActiveRecord::Base
  include CheckboxCallback

  belongs_to :user
  belongs_to :classroom

  after_create :delete_classroom_minis_cache_for_each_teacher_of_this_classroom
  after_commit :trigger_analytics_events_for_classroom_creation, on: :create

  ROLE_TYPES = {coteacher: 'coteacher', owner: 'owner'}

  def teacher
    self.user
  end

  def delete_classroom_minis_cache_for_each_teacher_of_this_classroom
    Classroom.find(self.classroom_id).teachers.ids.each do |id|
      $redis.del("user_id:#{id}_classroom_minis")
    end
  end

  private

  def trigger_analytics_events_for_classroom_creation
    find_or_create_checkbox('Create a Classroom', self.owner)
    ClassroomCreationWorker.perform_async(self.classroom_id)
  end

end
