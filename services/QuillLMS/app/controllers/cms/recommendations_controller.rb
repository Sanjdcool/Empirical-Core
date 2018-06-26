class Cms::RecommendationsController < Cms::CmsController
  def index
    @activity_classification = ActivityClassification
      .find(params[:activity_classification_id])
    @activity = Activity.find(params[:activity_id])
  end

  def new
    @activity_classification = ActivityClassification
      .find(params[:activity_classification_id])
    @activity = Activity.find(params[:activity_id])
    @unit_templates = UnitTemplate.all
    @concepts = Concept.all
    @recommendation = Recommendation.new
  end
end
