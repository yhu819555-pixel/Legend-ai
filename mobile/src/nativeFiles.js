import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  MAX_BACKUP_FILE_BYTES,
  MAX_IMPORTED_FILE_BYTES,
  normalizeImportedTextFile,
  validatePickedFileSize
} from "./fileImport.js";

async function getPickedAsset(types) {
  const result = await DocumentPicker.getDocumentAsync({
    type: types,
    copyToCacheDirectory: true,
    multiple: false
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

async function getAssetSize(asset) {
  if (Number.isFinite(asset.size)) return asset.size;
  const info = await FileSystem.getInfoAsync(asset.uri);
  return info.exists ? info.size : null;
}

export async function pickTextFile() {
  const asset = await getPickedAsset([
    "text/*",
    "application/json",
    "application/javascript",
    "application/xml"
  ]);
  if (!asset) return null;
  validatePickedFileSize(await getAssetSize(asset), MAX_IMPORTED_FILE_BYTES);
  const content = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8
  });
  return normalizeImportedTextFile(asset.name, content);
}

export async function pickBackupFile() {
  const asset = await getPickedAsset("application/json");
  if (!asset) return null;
  validatePickedFileSize(await getAssetSize(asset), MAX_BACKUP_FILE_BYTES);
  return FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8
  });
}

export async function shareBackupFile(backup) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("File sharing is not available on this device");
  }
  const uri = FileSystem.cacheDirectory + "legend-ai-backup-" +
    new Date().toISOString().replace(/[:.]/g, "-") + ".json";
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup), {
    encoding: FileSystem.EncodingType.UTF8
  });
  await Sharing.shareAsync(uri, {
    mimeType: "application/json",
    dialogTitle: "Export Legend AI backup"
  });
}
