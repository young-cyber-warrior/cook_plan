import { CryptoDigestAlgorithm, digest } from 'expo-crypto';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import {
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
} from 'expo-image-picker';

export const MAX_RECIPE_PHOTOS = 3;

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.7;

export interface PhotoSource {
  uri: string;
  width: number;
  height: number;
}

export interface PreparedPhoto {
  data: ArrayBuffer;
  hash: string;
  width: number;
  height: number;
  bytes: number;
}

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
// ддля всех где блять обратобка ошибок!!!!!!!!!!!!!!!!!!!!
export async function pickPhoto(): Promise<PhotoSource | null> {
  const permission = await requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (result.canceled) return null;

  const asset = result.assets[0]; 
  // почему получаем тольок первое фото
  return asset ? { uri: asset.uri, width: asset.width, height: asset.height } : null;
}

export async function capturePhoto(): Promise<PhotoSource | null> {
  const permission = await requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  if (result.canceled) return null;
  // почему получаем тольок первое фото

  const asset = result.assets[0];
  return asset ? { uri: asset.uri, width: asset.width, height: asset.height } : null;
}

export async function preparePhoto(source: PhotoSource): Promise<PreparedPhoto> {
  const context = ImageManipulator.manipulate(source.uri);
  if (Math.max(source.width, source.height) > MAX_DIMENSION) {
    context.resize(
      source.width >= source.height ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION },
    );
  }
// почему не сжелать через функции котрые есть в промиче что каждой следующей нужен результа пердыдущего есть же фугкц ииз прописа 
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  const data = await new File(saved.uri).arrayBuffer();

  return {
    data,
    hash: toHex(await digest(CryptoDigestAlgorithm.SHA256, data)),
    width: saved.width,
    height: saved.height,
    bytes: data.byteLength,
  };
}
