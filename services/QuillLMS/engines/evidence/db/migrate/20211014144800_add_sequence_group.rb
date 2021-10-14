class AddSequenceGroup < ActiveRecord::Migration[5.1]
  def change
    create_table :evidence_sequence_groups do |t|
      t.integer :rule_id, null: false

      t.timestamps null: false
    end
    add_reference :evidence_sequence_groups, :evidence_rule, index: true
  end
end
