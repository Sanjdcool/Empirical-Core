class RuleFeedbackHistory
    def self.generate_report(conjunction:, activity_id:)
        sql_result = exec_query(conjunction: conjunction, activity_id: activity_id)
        postprocessed = postprocessing(sql_result)
        format_sql_results(postprocessed)
    end

    def self.exec_query(conjunction:, activity_id:)
        sql = <<~SQL
          select rules.uid as rules_uid, 
            MAX(feedback_histories.id),
            MAX(prompts.activity_id) as activity_id, 
            MAX(rules.rule_type) as rule_type, 
            MAX(rules.suborder) as rule_suborder,
            MAX(rules.name) as rule_name, 
            MAX(rules.description) as rule_description, 
            ARRAY_AGG(feedback_histories.id) as feedback_histories_id_array

          FROM comprehension_rules as rules 
          INNER JOIN comprehension_prompts_rules as prompts_rules ON rules.id = prompts_rules.rule_id 
          INNER JOIN comprehension_prompts as prompts ON prompts_rules.prompt_id = prompts.id 
          LEFT JOIN feedback_histories ON feedback_histories.rule_uid = rules.uid
          WHERE prompts.conjunction = '#{conjunction}' AND activity_id = '#{activity_id}'
          GROUP BY rules_uid 
        SQL
        rules = Comprehension::Rule.find_by_sql(sql)
    end

    def self.postprocessing(rules_sql_result)
        rules_sql_result.each do |r| 
            
            feedback_histories = FeedbackHistory
                .where(id: r.feedback_histories_id_array).includes(:feedback_history_ratings)

            total_scored = feedback_histories.reduce(0) do |memo, n|
                memo + n.feedback_history_ratings.count
            end

            if total_scored == 0 
                total_strong = 0
                r.define_singleton_method(:pct_strong) { 0 }
                r.define_singleton_method(:pct_scored) { 0 }
            else 
                total_strong = feedback_histories.reduce(0) do |memo, n|
                    memo + n.feedback_history_ratings.filter(&:rating).count
                end

                r.define_singleton_method(:pct_strong) { total_strong/total_scored.to_f }
                # note: pct_scored may be over counting since the original spec may not
                # account for one feedback history having more than one score.
                r.define_singleton_method(:pct_scored) { total_scored/total_scored.to_f }
            end

            r.define_singleton_method(:scored_responses_count) { total_scored }
            r.define_singleton_method(:total_responses) { feedback_histories.count }
        end 

        rule_feedbacks = Comprehension::Rule
            .includes(:feedbacks)
            .where(uid: rules_sql_result.map(&:rules_uid)) 

        rules_sql_result.each do |r|
            feedbacks = rule_feedbacks.find_by(uid: r.rules_uid).feedbacks
            r.first_feedback = feedbacks.empty? ? '' : feedbacks.min_by {|f| f.order}.text
        end

        rules_sql_result
    end

    def self.format_sql_results(relations)
        relations.map do |r|
            {
                rule_uid: r.rules_uid,
                api_name: r.rule_type,
                rule_order: r.rule_suborder,
                first_feedback: r.first_feedback,
                rule_description: r.rule_description,
                rule_name: r.rule_name,
                total_responses: r.total_responses,
                pct_strong: r.pct_strong, 
                scored_responses: r.scored_responses_count, # may want to rename for clarity
                pct_scored: r.pct_scored
            }

        end
    end
end
