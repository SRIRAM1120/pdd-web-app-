import '@testing-library/jest-dom/vitest'

// pdf.js checks this browser primitive at module initialization.
if (!('DOMMatrix' in globalThis)) {
  Object.defineProperty(globalThis, 'DOMMatrix', { value: class DOMMatrix {} })
}
