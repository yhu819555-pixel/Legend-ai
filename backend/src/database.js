import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const migrationPath = join(dirname(fileURLToPath(import.meta.url)), "../migrations/001_initial.sql");

export async function createDatabase({ connectionString = process.env.DATABASE_URL, ssl = process.env.DATABASE_SSL === "true" } = {}) {
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString,
    ssl: ssl ? { rejectUnauthorized: true } : undefined,
    max: Number(process.env.DATABASE_POOL_SIZE || 5),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });
  return createProjectStore(pool);
}

export function createProjectStore(pool) {
  return {
    async migrate() {
      const sql = await readFile(migrationPath, "utf8");
      await pool.query(sql);
    },
    async listProjects() {
      const { rows } = await pool.query(
        "SELECT id, name, created_at AS \"createdAt\", updated_at AS \"updatedAt\" FROM projects ORDER BY updated_at DESC"
      );
      return rows;
    },
    async createProject(project) {
      const { rows } = await pool.query(
        "INSERT INTO projects (id, name) VALUES ($1, $2) RETURNING id, name, created_at AS \"createdAt\", updated_at AS \"updatedAt\"",
        [project.id, project.name]
      );
      return rows[0];
    },
    async getProject(id) {
      const result = await pool.query(
        "SELECT id, name, created_at AS \"createdAt\", updated_at AS \"updatedAt\" FROM projects WHERE id = $1",
        [id]
      );
      if (!result.rows[0]) return null;
      const files = await pool.query(
        "SELECT id, name, content, updated_at AS \"updatedAt\" FROM project_files WHERE project_id = $1 ORDER BY updated_at DESC",
        [id]
      );
      const messages = await pool.query(
        "SELECT id, role, content, created_at AS \"createdAt\" FROM chat_messages WHERE project_id = $1 ORDER BY position ASC",
        [id]
      );
      return { ...result.rows[0], files: files.rows, messages: messages.rows };
    },
    async updateProject(id, patch) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        if (patch.name !== undefined) {
          const updated = await client.query(
            "UPDATE projects SET name = $2, updated_at = NOW() WHERE id = $1 RETURNING id",
            [id, patch.name]
          );
          if (!updated.rowCount) { await client.query("ROLLBACK"); return null; }
        } else {
          const exists = await client.query("SELECT id FROM projects WHERE id = $1", [id]);
          if (!exists.rowCount) { await client.query("ROLLBACK"); return null; }
        }
        if (patch.files !== undefined) {
          await client.query("DELETE FROM project_files WHERE project_id = $1", [id]);
          for (const file of patch.files) {
            await client.query(
              "INSERT INTO project_files (id, project_id, name, content) VALUES ($1, $2, $3, $4)",
              [file.id, id, file.name, file.content]
            );
          }
        }
        if (patch.messages !== undefined) {
          await client.query("DELETE FROM chat_messages WHERE project_id = $1", [id]);
          for (let position = 0; position < patch.messages.length; position += 1) {
            const message = patch.messages[position];
            await client.query(
              "INSERT INTO chat_messages (id, project_id, role, content, position) VALUES ($1, $2, $3, $4, $5)",
              [message.id, id, message.role, message.content, position]
            );
          }
        }
        await client.query("UPDATE projects SET updated_at = NOW() WHERE id = $1", [id]);
        await client.query("COMMIT");
        return this.getProject(id);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async deleteProject(id) {
      const result = await pool.query("DELETE FROM projects WHERE id = $1 RETURNING id", [id]);
      return result.rowCount > 0;
    },
    async close() { await pool.end(); }
  };
}
