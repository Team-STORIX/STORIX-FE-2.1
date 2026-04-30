// Minimal type shim for text-encoding@0.7.0 (no @types package available).
// Only the surface used by the polyfill in app/_layout.tsx is declared.
declare module 'text-encoding' {
  export class TextEncoder {
    encode(input?: string): Uint8Array
  }
  export class TextDecoder {
    decode(input?: ArrayBuffer | ArrayBufferView | null, options?: { stream?: boolean }): string
  }
}
