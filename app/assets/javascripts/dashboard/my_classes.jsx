EC.MyClasses = React.createClass({

  createMinis: function() {
    var i = 0;
    var minis = _.map(this.props.classList, function(classObj) {
      if (i === 3) {
        i = 0;
      }
      i++;
      return <EC.ClassMini classObj={classObj} rowNum={i}/>;
    });
    return minis;
  },

  render: function() {
    return (
      <div className='classes_container'>
    <h3 className='dashboard-header'>My Classes</h3>
      <div className='row'>
        {this.createMinis()}
      </div>
    </div>
    );
  }

});
