import { ExpoFileSystemStorageAdapter } from '@powersync/attachments-storage-react-native';
import {
  AttachmentQueue,
  type AttachmentErrorHandler,
  type AttachmentRecord,
  type RemoteStorageAdapter,
  type WatchedAttachmentItem,
} from '@powersync/react-native';

import { supabase } from '@/lib/supabase';

import { powersync } from './database';

export const PHOTO_BUCKET = 'recipe-photos';
export const PHOTO_MEDIA_TYPE = 'image/jpeg';
export const PHOTO_EXTENSION = 'jpg';

export const photoStoragePath = (hash: string) => `recipes/${hash}.${PHOTO_EXTENSION}`;

/** React Native's Blob has no `arrayBuffer()`; FileReader is the only route to its bytes. */
function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('could not read the downloaded photo'));
    reader.readAsArrayBuffer(blob);
  });
}

function pathOf(attachment: AttachmentRecord): string {
  const hash = attachment.metaData;
  if (!hash) throw new Error(`attachment ${attachment.id} has no content hash`);
  return photoStoragePath(hash);
}
// обработка ошибок учтена так ?
const remoteStorage: RemoteStorageAdapter = {
  async uploadFile(fileData, attachment) {
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(pathOf(attachment), fileData, {
        contentType: attachment.mediaType ?? PHOTO_MEDIA_TYPE,
        upsert: true,
      });
    if (error) throw error;
  },

  async downloadFile(attachment) {
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).download(pathOf(attachment));
    if (error) throw error;
    return blobToArrayBuffer(data);
  },

  async deleteFile(attachment) {
    const hash = attachment.metaData;
    if (!hash) return;

    const { data, error } = await supabase.rpc('photo_refcount', { p_hash: hash });
    if (error) throw error;
    if ((data ?? 0) > 0) return;

    const { error: removeError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .remove([photoStoragePath(hash)]);
    if (removeError) throw removeError;
  },
};

function watchAttachments(
  onUpdate: (attachments: WatchedAttachmentItem[]) => Promise<void>,
  signal: AbortSignal,
) {
  // изучи как постореа обратока ошибок/логи в сторах при такои напсиании кода 
  powersync.watch(
    'select id, content_hash from recipe_photos where deleted = 0',
    [],
    {
      onResult: results => {
        // полна дичшь оптимизируй зачаем два раза сощдавиа массив 
        const items = (results.array as { id: string; content_hash: string | null }[])
          .filter(row => !!row.content_hash)
          .map(row => ({
            id: row.id,
            filename: `${row.id}.${PHOTO_EXTENSION}`,
            mediaType: PHOTO_MEDIA_TYPE,
            metaData: row.content_hash ?? undefined,
          }));
        void onUpdate(items);
      },
      onError: cause => console.error('attachments.watch', cause),
    },
    { signal },
  );
}

/** The default 30s is a long stall for a photo that failed its first download. */
const SYNC_INTERVAL_MS = 10_000;

/** Transfers fail silently otherwise: the queue just retries and the tile keeps spinning. */
const errorHandler: AttachmentErrorHandler = {
  async onDownloadError(attachment, error) {
    console.error('attachments.download', attachment.id, attachment.metaData, error);
    return true;
  },
  async onUploadError(attachment, error) {
    console.error('attachments.upload', attachment.id, attachment.metaData, error);
    return true;
  },
  async onDeleteError(attachment, error) {
    console.error('attachments.delete', attachment.id, attachment.metaData, error);
    return true;
  },
};

export function createAttachmentQueue(): AttachmentQueue {
  return new AttachmentQueue({
    db: powersync,
    localStorage: new ExpoFileSystemStorageAdapter(),
    remoteStorage,
    watchAttachments,
    syncIntervalMs: SYNC_INTERVAL_MS,
    errorHandler,
  });
}
