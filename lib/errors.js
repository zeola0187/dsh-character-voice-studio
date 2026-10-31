export class VoiceError extends Error {
  constructor(code, message) { super(message); this.name = 'VoiceError'; this.code = code; }
}
export function fail(code, message) { throw new VoiceError(code, message); }
export function resultError(error) {
  if (error instanceof VoiceError) return {success:false,error_code:error.code,error_message:error.message};
  if (error?.name === 'AbortError') return {success:false,error_code:'CANCELLED',error_message:'已取消。已送出的雲端請求可能仍會計費，不會自動重送。'};
  return {success:false,error_code:'LOCAL_ERROR',error_message:'本機操作失敗。請檢查設定 JSON、資料夾存取權與可用空間；沒有自動重送雲端請求。'};
}
