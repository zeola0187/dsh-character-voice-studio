import { fail } from './errors.js';
export const RATE = 44100;
export const MAX_AUDIO_BYTES = 64 * 1024 * 1024;
export function decodeWav(bytes) {
  const b = Buffer.from(bytes);
  if (b.length < 44 || b.length > MAX_AUDIO_BYTES || b.toString('ascii',0,4) !== 'RIFF' || b.toString('ascii',8,12) !== 'WAVE') fail('INVALID_AUDIO','雲端未傳回有效 WAV。');
  const end = b.readUInt32LE(4)+8;
  if (end !== b.length) fail('INVALID_AUDIO','WAV 長度不符，可能下載不完整。');
  let fmt, pcm;
  for (let p=12;p<end;) {
    if (p+8>end) fail('INVALID_AUDIO','WAV chunk 標頭損毀。');
    const id=b.toString('ascii',p,p+4), size=b.readUInt32LE(p+4), start=p+8;
    if (start+size>end) fail('INVALID_AUDIO','WAV chunk 不完整。');
    if(id==='fmt ') { if(fmt || size<16) fail('INVALID_AUDIO','WAV fmt 無效。'); fmt=b.subarray(start,start+size); }
    if(id==='data') { if(pcm) fail('INVALID_AUDIO','WAV 包含重複 data。'); pcm=b.subarray(start,start+size); }
    p=start+size+(size%2);
  }
  if(!fmt || !pcm?.length) fail('EMPTY_AUDIO','WAV 沒有音訊資料。');
  const channels=fmt.readUInt16LE(2), rate=fmt.readUInt32LE(4), align=fmt.readUInt16LE(12);
  if(fmt.readUInt16LE(0)!==1 || fmt.readUInt16LE(14)!==16 || ![1,2].includes(channels) || rate<8000 || rate>192000 || align!==channels*2 || fmt.readUInt32LE(8)!==rate*align || pcm.length%align) fail('UNSUPPORTED_AUDIO','需要 PCM16 mono/stereo WAV（8–192kHz）。');
  return {pcm,channels,rate,frames:pcm.length/align,duration:pcm.length/(align*rate)};
}
export function encodeWav(pcm, rate=RATE, channels=1) {
  const b=Buffer.alloc(44+pcm.length); b.write('RIFF'); b.writeUInt32LE(b.length-8,4); b.write('WAVEfmt ',8); b.writeUInt32LE(16,16); b.writeUInt16LE(1,20); b.writeUInt16LE(channels,22); b.writeUInt32LE(rate,24); b.writeUInt32LE(rate*channels*2,28); b.writeUInt16LE(channels*2,32); b.writeUInt16LE(16,34); b.write('data',36); b.writeUInt32LE(pcm.length,40); pcm.copy(b,44); return b;
}
export function normalizeWav(bytes) {
  const a=decodeWav(bytes), n=Math.round(a.frames*RATE/a.rate);
  if(n>RATE*600) fail('AUDIO_LIMIT','音訊超過十分鐘上限。');
  const pcm=Buffer.alloc(n*2), at=i=>{let v=0;for(let c=0;c<a.channels;c++)v+=a.pcm.readInt16LE((Math.min(a.frames-1,i)*a.channels+c)*2);return v/a.channels;};
  // Do not trim speech. A 2ms edge ramp prevents abrupt discontinuities.
  const edge=Math.min(88,Math.floor(n/2));
  for(let i=0;i<n;i++){const pos=i*a.rate/RATE,lo=Math.floor(pos),f=pos-lo;let v=at(lo)*(1-f)+at(lo+1)*f;if(edge)v*=Math.min(1,i/edge,(n-1-i)/edge);pcm.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(v))),i*2);}
  return pcm;
}
export function joinWav(segments) {
  const chunks=[]; let frames=0; const silences=[];
  const pause=ms=>{const n=Math.round(ms*RATE/1000);if(n){silences.push({start_frame:frames,frames:n});chunks.push(Buffer.alloc(n*2));frames+=n;}};
  for(const s of segments){pause(s.pause_before_ms??0);const pcm=normalizeWav(s.audio);chunks.push(pcm);frames+=pcm.length/2;pause(s.pause_after_ms??0);if(frames>RATE*600)fail('AUDIO_LIMIT','總音訊超過十分鐘上限。');}
  return {bytes:encodeWav(Buffer.concat(chunks)),duration:frames/RATE,silences};
}
