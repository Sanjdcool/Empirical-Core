require 'open3'

namespace :db do
  namespace :snapshots do

    desc "restore a db snapshot"
    task :restore do
      db_name = Rails.configuration.database_configuration[Rails.env]["database"]
      system "pg_restore --verbose --clean --no-acl --no-owner -d #{db_name} quill_snapshot.dump"
    end

    desc "create a snapshot..."
    task :create do
      db_name = Rails.configuration.database_configuration[Rails.env]["database"]
      system "pg_dump -b -c -o -F c -v -f quill_snapshot.dump #{db_name}"
    end

    desc "synchronize from staging.."
    task :staging_sync do

      db_name = Rails.configuration.database_configuration[Rails.env]["database"]

      system "heroku pgbackups:capture --expire --app empirical-grammar-staging"
      system "curl -o quill_staging.dump `heroku pgbackups:url --app empirical-grammar-staging`"
      system "echo 'drop schema public cascade; create schema public;' | psql -d #{db_name}"
      system "pg_restore --verbose --clean --no-acl --no-owner -d #{db_name} quill_staging.dump"

      Rake::Task['db:migrate'].invoke
    end


    desc "cleanup any mess"
    task :cleanup do
      system "rm quill_snapshot.dump quill_staging.dump"
    end

    # Instructions for data transfer here:
    # https://www.notion.so/quill/Manual-LMS-BiqQuery-Data-Transfer-4734e3d07571493ab398e2f1a46e9477

    # bundle exec rake db:snapshots:analytics_restore\[lms_snapshot_05_24_2021,/Volumes/my_passport/lms_data/2021-05-24/lms_data_dump_2021_05_24,/Volumes/my_passport/lms_data/2021-05-24/exports\]
    desc 'analytics restore tables'
    task :analytics_restore, [:db_name, :db_snapshot_path, :export_path]  do |t, args|
      # prereq - create an empty database

      include RestoreAnalytics
      db_name = args[:db_name]
      db_snapshot_path = args[:db_snapshot_path]
      export_path = args[:export_path]

      up_timeout = "psql -U quill_dev -d #{db_name} -c \"ALTER DATABASE #{db_name} SET statement_timeout = '600000s';\""
      run_cmd(up_timeout)
      # ensure hstore (used by activity sessions)
      create_hstore = "psql -U quill_dev -d #{db_name} -c \"CREATE EXTENSION hstore;\""

      RestoreAnalytics::TABLES_IN_ORDER.each do |table|
        puts "****************** Restoring '#{table}'' table from #{db_snapshot_path}"

        restore = "pg_restore -U quill_dev -d #{db_name} -t #{table} -j 8 --no-owner #{db_snapshot_path}"
        run_cmd(restore)

        puts "****************** Exporting '#{table}' as csv to #{export_path}"

        select_statement = RestoreAnalytics::CUSTOM_EXPORT_SELECTS[table.to_sym] || table

        copy = "psql -U quill_dev -d #{db_name} -c \"COPY #{select_statement} TO '#{export_path}/#{table}.csv' WITH (FORMAT CSV, HEADER);\""
        run_cmd(copy)
      end
    end

    # Install command line sdk here
    # https://cloud.google.com/sdk/docs/install
    # bundle exec rake db:snapshots:load_to_bigquery\[lms_2021_05_24,gs://lms_data_2021_05_24/exports\]
    desc 'load into bigquery. Requires google command line sdk to use `bq` command'
    task :load_to_bigquery, [:dataset, :cloud_file_path]  do |t, args|
      include RestoreAnalytics
      dataset = args[:dataset]
      cloud_file_path = args[:cloud_file_path]

      RestoreAnalytics::TABLES_IN_ORDER.each do |table|
        puts "****************** Importing '#{table}' to '#{dataset}' dataset"
        command = "bq load --max_bad_records 100 --autodetect --allow_jagged_rows #{dataset}.#{table} #{cloud_file_path}/#{table}.csv"

        run_cmd(command)
      end
    end

    module RestoreAnalytics
      def run_cmd(command)
        stdout_str, stderr_str, status = Open3.capture3(command)

        if !stderr_str.squish.empty?
          puts "Errors: #{stderr_str}"
        end
      end

      TABLES_IN_ORDER = %w(standard_levels standard_categories standards raw_scores activities unit_templates schools users schools_users classrooms students_classrooms subscriptions user_subscriptions units classroom_units activity_sessions)

      # these get around problematic fields, such as json data or data the BigQuery imports incorrectly, e.g. strings that are all numbers except for 1 record, BigQuery assumes a number data type, then errors on the non-number one
      CUSTOM_EXPORT_SELECTS = {
        activities: "(SELECT id,name,description,uid,data->'flag' AS data_flag,data->'title' AS data_title,activity_classification_id,topic_id,created_at,updated_at,flags[1] AS flag, repeatable,follow_up_activity_id,supporting_info,standard_id,raw_score_id FROM activities)",
        users: "(SELECT id,role,created_at,updated_at,classcode,active,username,token,clever_id,signed_up_with_google,send_newsletter,google_id,last_sign_in,last_active,stripe_customer_id,flags,time_zone,title,account_type,post_google_classroom_assignments FROM users)",
        activity_sessions: "(SELECT id,classroom_activity_id,activity_id,user_id,pairing_id,percentage,state,completed_at, uid,temporary,created_at, updated_at, started_at,is_retry,is_final_score,visible,classroom_unit_id,timespent FROM activity_sessions)",
        schools: "(SELECT id, nces_id,lea_id,leanm,name,mail_street,mail_city,mail_state,mail_zipcode, street,city,state,zipcode,magnet,charter,ethnic_group,longitude,latitude,ulocal,fte_classroom_teacher,lower_grade,upper_grade,school_level,free_lunches,total_students,created_at,updated_at,clever_id,ppin,authorizer_id,coordinator_id FROM schools)",
        unit_templates: "(SELECT id, name, unit_template_category_id,time,author_id,flag,order_number,created_at,updated_at,image_link FROM unit_templates)"
      }
    end
  end
end
