class AddSequence < ActiveRecord::Migration[5.1]
  def change
    create_table :evidence_sequences do |t|
      t.integer :sequence_group_id, null: false
      t.string :regex_text, limit: 200, null: false
      t.boolean :case_sensitive, null: false
      t.string :sequence_type, null: false, default: "incorrect"

      t.timestamps null: false
    end
    add_reference :evidence_sequences, :evidence_sequence_group, index: true
    add_foreign_key :evidence_sequences, :evidence_sequence_groups, column: :sequence_group_id, on_delete: :cascade
  end
end
