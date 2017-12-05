class ClassroomsTeachersController < ApplicationController
  before_action :signed_in!
  before_action :multi_classroom_auth, only: :update_coteachers

  def edit_coteacher_form
    @classrooms_grouped_by_coteacher_id = Hash.new {|h,k| h[k] = [] }
    @coteachers = Set.new
    @classrooms = classrooms_and_coteachers.map do |classy|
      if classy["coteacher_id"]
        @coteachers << {id: classy['coteacher_id'], name: classy['coteacher_name']}
        @classrooms_grouped_by_coteacher_id[classy["coteacher_id"]].push(classy["classroom_id"])
      end
      {id: classy["classroom_id"], name: classy["classroom_name"]}
    end
    @classrooms.uniq!
    @classrooms
    @selected_teacher_id = params[:classrooms_teacher_id].to_i
  end

  def update_coteachers
    begin
      partitioned_classrooms = params[:classrooms].partition { |classroom| classroom['checked'] }
      positive_classroom_ids = partitioned_classrooms.first.collect { |classroom| classroom['id'].to_i }
      negative_classroom_ids = partitioned_classrooms.second.collect { |classroom |classroom['id'].to_i }
      coteacher = User.find(params[:classrooms_teacher_id].to_i)
      coteacher.handle_negative_classrooms_from_update_coteachers(negative_classroom_ids)
      coteacher.handle_positive_classrooms_from_update_coteachers(positive_classroom_ids, current_user.id)
    rescue => e
      return render json: { error_message: e }, status: 422
    end
    return render json: {message: 'Update Succeeded!'}
  end

  private

  def multi_classroom_auth
    uniqued_classroom_ids = params[:classrooms].uniq
    ClassroomsTeacher.where(user_id: current_user.id, classroom_id: uniqued_classroom_ids, role: 'owner').length == uniqued_classroom_ids.length
  end

  def classrooms_and_coteachers
    ActiveRecord::Base.connection.execute("
      SELECT classrooms.id AS classroom_id, classrooms.name AS classroom_name, coteachers.name AS coteacher_name, coteachers.id AS coteacher_id
        FROM classrooms_teachers AS my_classrooms_teachers
        LEFT JOIN classrooms_teachers AS coteacher_classrooms_teachers
          ON coteacher_classrooms_teachers.classroom_id = my_classrooms_teachers.classroom_id
          AND coteacher_classrooms_teachers.role = 'coteacher'
        LEFT JOIN users AS coteachers ON coteacher_classrooms_teachers.user_id = coteachers.id
        JOIN classrooms ON classrooms.id = my_classrooms_teachers.classroom_id
        WHERE my_classrooms_teachers.role = 'owner' AND my_classrooms_teachers.user_id = #{current_user.id}
    ").to_a
  end


end
