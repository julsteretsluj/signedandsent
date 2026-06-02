import { Readable } from "node:stream";
import { google } from "googleapis";
import type { drive_v3 } from "googleapis";
import { CENTRAL_INBOX_EMAIL } from "./email";

/** SEAMUN signed consent PDFs folder (override with GOOGLE_DRIVE_FOLDER_ID). */
export const DEFAULT_GOOGLE_DRIVE_FOLDER_ID =
  "1kO3j1QfOJvaEkf-1rb-8Pz_Ro642Og41";

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
  [key: string]: unknown;
};

function parseServiceAccountJson(raw: string): ServiceAccountCredentials {
  const parsed = JSON.parse(raw) as ServiceAccountCredentials;
  if (typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }
  return parsed;
}

function getServiceAccountCredentials(): ServiceAccountCredentials | null {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!json) {
    return null;
  }
  try {
    return parseServiceAccountJson(json);
  } catch (error) {
    console.error(
      "Invalid GOOGLE_SERVICE_ACCOUNT_JSON:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/** Organiser inbox that owns the backup folder — never exposed to parents. */
function getDriveOwnerEmail(): string {
  return process.env.GOOGLE_DRIVE_OWNER_EMAIL?.trim() || CENTRAL_INBOX_EMAIL;
}

export function isGoogleDriveConfigured(): boolean {
  return !!getServiceAccountCredentials();
}

function getDriveFolderId(): string {
  return (
    process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() ||
    DEFAULT_GOOGLE_DRIVE_FOLDER_ID
  );
}

function getDriveClient() {
  const credentials = getServiceAccountCredentials();
  if (!credentials) {
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  return google.drive({ version: "v3", auth });
}

/** Strip public/link sharing and transfer ownership to the organiser inbox. */
async function restrictToOrganiserInbox(
  drive: drive_v3.Drive,
  fileId: string
): Promise<void> {
  const ownerEmail = getDriveOwnerEmail();

  const { data } = await drive.permissions.list({
    fileId,
    fields: "permissions(id,type,role,emailAddress)",
    supportsAllDrives: true,
  });

  for (const permission of data.permissions ?? []) {
    if (permission.type === "anyone" && permission.id) {
      await drive.permissions.delete({
        fileId,
        permissionId: permission.id,
        supportsAllDrives: true,
      });
    }
  }

  await drive.permissions.create({
    fileId,
    requestBody: {
      type: "user",
      role: "owner",
      emailAddress: ownerEmail,
    },
    transferOwnership: true,
    supportsAllDrives: true,
  });
}

/**
 * Upload a signed PDF to the organiser-only Drive folder.
 * Server-side backup for information@seamun.com — never linked or shown to parents.
 */
export async function uploadPdfToGoogleDrive(
  filename: string,
  pdf: Buffer
): Promise<boolean> {
  const drive = getDriveClient();
  if (!drive) {
    return false;
  }

  const folderId = getDriveFolderId();
  const response = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
      writersCanShare: false,
      copyRequiresWriterPermission: true,
    },
    media: {
      mimeType: "application/pdf",
      body: Readable.from(pdf),
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const fileId = response.data.id;
  if (!fileId) {
    throw new Error("Google Drive upload succeeded but returned no file id.");
  }

  try {
    await restrictToOrganiserInbox(drive, fileId);
  } catch (error) {
    console.error(
      "Google Drive: uploaded but could not restrict to organiser inbox:",
      error instanceof Error ? error.message : error
    );
  }

  return true;
}

/** Best-effort organiser backup; failures are logged and never shown to parents. */
export async function copyPdfToGoogleDrive(
  filename: string,
  pdf: Buffer
): Promise<boolean> {
  if (!isGoogleDriveConfigured()) {
    return false;
  }

  try {
    const uploaded = await uploadPdfToGoogleDrive(filename, pdf);
    if (uploaded) {
      console.info(`Google Drive: organiser backup saved (${filename})`);
    }
    return uploaded;
  } catch (error) {
    console.error(
      "Google Drive upload failed:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}
