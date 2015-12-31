'use strict';

EC.UnitTemplatesAssigned = React.createClass({
  propTypes: {
    data: React.PropTypes.object.isRequired,
    actions: React.PropTypes.object.isRequired
  },

  hideSubNavBars: function() {
    $(".unit-tabs").hide();
    $(".tab-outer-wrap").hide();
  },

  activityName: function() {
    return this.props.data.name;
  },

  teacherSpecificComponents: function() {
    this.hideSubNavBars();
    console.log(this.props.data);
    var proceedButton;
    if (this.props.actions.studentsPresent() === true) {
      proceedButton = (
        <span>
            <a href = '/teachers/classrooms/lesson_planner'>
              <button onClick className="button-green add-students pull-right">
                View Assigned Activity Packs <i class="fa fa-long-arrow-right"></i>
              </button>
            </a>
        </span>);
    } else {
      proceedButton = (
        <span>
            <a href = {this.props.actions.getInviteStudentsUrl()} >
              <button onClick className="button-green add-students pull-right">
                Add Students <i class="fa fa-long-arrow-right"></i>
              </button>
            </a>
        </span>);
    };
    return (proceedButton);

  },

  render: function () {
    return (
    <div className='successBox'>
      <div className='container'>
        <div className='row' id='successBoxMessage'>
          <div className='col-md-1 cold-md-offset-1'>
            <i className="fa fa-check-circle pull-left"></i>
          </div>
          <div className='col-md-7 assign-success-message pull-left'>
            You’ve successfully assigned the <strong>{this.activityName()}</strong> Activity Pack!
          </div>
          <div className='col-md-4 pull-right'>
            {this.teacherSpecificComponents()}
          </div>
        </div>
      </div>
    </div>
  );
  }
});
