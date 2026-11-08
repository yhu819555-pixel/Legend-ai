ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS position INTEGER;

WITH ordered_messages AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at, id) - 1 AS position
  FROM chat_messages
)
UPDATE chat_messages AS messages
SET position = ordered_messages.position
FROM ordered_messages
WHERE messages.id = ordered_messages.id
  AND messages.position IS NULL;

ALTER TABLE chat_messages ALTER COLUMN position SET NOT NULL;

CREATE INDEX IF NOT EXISTS chat_messages_project_position_idx
  ON chat_messages(project_id, position);
