import {decodeWav, MAX_AUDIO_BYTES, RATE} from './audio.js';
import {fail} from './errors.js';

// Fish's documented placeholder pair, also observed in native /v1/tts output.
// https://docs.fish.audio/developer-guide/compat/capabilities#audio-formats
const RIFF_PLACEHOLDER = 0xffffff24;
const DATA_PLACEHOLDER = 0xffffff00;

/**
 * Adapt a COMPLETED Fish TTS response, never an arbitrary imported WAV.
 * The only special case is the canonical 44-byte PCM16/mono/44100 header
 * requested by FishProvider. Its data payload extends to the HTTP body's EOF.
 * Unknown layouts/sentinels remain errors; there is no scan for "data".
 * An aligned early EOF, or metadata disguised as PCM under this contract,
 * cannot be identified from these bytes. This does not prove speech completion.
 * Return an owned copy; caller input and PCM bytes are never changed.
 */
export function normalizeFishWav(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 44 || bytes.byteLength > MAX_AUDIO_BYTES) {
    fail('INVALID_AUDIO', 'Fish 未傳回大小有效的 WAV。');
  }
  const b = Buffer.from(bytes);
  if (b.readUInt32LE(4) === RIFF_PLACEHOLDER) {
    const canonical = b.toString('latin1', 0, 4) === 'RIFF'
      && b.toString('latin1', 8, 16) === 'WAVEfmt '
      && b.readUInt32LE(16) === 16
      && b.readUInt16LE(20) === 1
      && b.readUInt16LE(22) === 1
      && b.readUInt32LE(24) === RATE
      && b.readUInt32LE(28) === RATE * 2
      && b.readUInt16LE(32) === 2
      && b.readUInt16LE(34) === 16
      && b.toString('latin1', 36, 40) === 'data'
      && b.readUInt32LE(40) === DATA_PLACEHOLDER;
    if (!canonical) fail('INVALID_AUDIO', 'Fish WAV 佔位標頭不符合已知格式，未自動修補。');
    const dataBytes = b.length - 44;
    if (!dataBytes) fail('EMPTY_AUDIO', 'Fish WAV 沒有音訊資料。');
    if (dataBytes % 2) fail('INVALID_AUDIO', 'Fish PCM16 資料未對齊，可能傳輸不完整。');
    b.writeUInt32LE(b.length - 8, 4);
    b.writeUInt32LE(dataBytes, 40);
  }
  // All ordinary finite-length WAVs still use the full strict chunk validator.
  decodeWav(b);
  return b;
}
