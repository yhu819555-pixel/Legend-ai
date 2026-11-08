import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_BACKUP_FILE_BYTES,
  MAX_IMPORTED_FILE_CHARS,
  normalizeImportedTextFile,
  validatePickedFileSize
} from "../src/fileImport.js";

test("normalizes a selected file to a safe project-local filename", () => {
  assert.deepEqual(normalizeImportedTextFile("folder\\main.js", "console.log('ok')"), {
    name: "main.js",
    content: "console.log('ok')"
  });
});

test("rejects oversized, empty-name and binary-like text imports", () => {
  assert.throws(() => normalizeImportedTextFile("main.js", "x".repeat(MAX_IMPORTED_FILE_CHARS + 1)), /too large/);
  assert.throws(() => normalizeImportedTextFile("../", "x"), /simple name/);
  assert.throws(() => normalizeImportedTextFile("image.png", "a\u0000b"), /text file/);
});

test("enforces selected-file byte limits, including backup limit", () => {
  assert.doesNotThrow(() => validatePickedFileSize(24000));
  assert.throws(() => validatePickedFileSize(24001), /too large/);
  assert.doesNotThrow(() => validatePickedFileSize(MAX_BACKUP_FILE_BYTES, MAX_BACKUP_FILE_BYTES));
  assert.throws(() => validatePickedFileSize(MAX_BACKUP_FILE_BYTES + 1, MAX_BACKUP_FILE_BYTES), /too large/);
});
