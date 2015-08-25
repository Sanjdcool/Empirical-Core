'use strict';
EC.ConceptResultStats = React.createClass({
  propTypes: {
    results: React.PropTypes.array.isRequired
  },

  calculateStats: function() {
    var stats = this.props.results.reduce(function (memo, conceptResult) {
      var statsRow = memo[conceptResult.concept_name] || {
        name: conceptResult.concept_name,
        correct: 0,
        incorrect: 0
      };
      memo[conceptResult.concept_name] = statsRow;
      var correct = parseInt(conceptResult.metadata.correct);
      if (correct) {
        statsRow.correct++;
      } else {
        statsRow.incorrect++;
      }
      return memo;
    }, []);
    return _.values(stats);
  },

  render: function () {
    var rows = this.calculateStats().map(function (statsRow) {
      return <EC.ConceptResultStat key={statsRow.name}
                                   name={statsRow.name}
                                   correct={statsRow.correct}
                                   incorrect={statsRow.incorrect} />;
    });
    return (
      <div>
        {rows}
      </div>
    );
  }
});