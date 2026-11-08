export const MAX_IMPORTED_FILE_CHARS = 6000;
export const MAX_IMPORTED_FILE_BYTES = 24000;
export const MAX_BACKUP_FILE_BYTES = 10 * 1024 * 1024;

export function validatePickedFileSize(size, maximum = MAX_IMPORTED_FILE_BYTES) {
  if (size !== null && size !== undefined && (!Number.isFinite(size) || size < 0 || size > maximum)) {
    throw new RangeError("Selected file is too large");
  }
}

export function normalizeImportedTextFile(name, content) {
  const cleanName = String(name ?? "").split(/[\\/]/).pop().trim();
  const text = String(content ?? "");
  if (!cleanName || cleanName.length > 100 || /[\\/]/.test(cleanName) || cleanName === "." || cleanName === "..") {
    throw new TypeError("File name must be a simple name without folders");
  }
  if (text.length > MAX_IMPORTED_FILE_CHARS) {
    throw new RangeError("Text file is too large (maximum 6000 characters)");
  }
  if (text.includes("\u0000")) {
    throw new TypeError("Selected file does not appear to be a text file");
  }
  return { name: cleanName, content: text };
}
