/// <reference types="vite/client" />

declare module '*.wasm?url' {
  const url: string;
  export default url;
}

declare module '*?url' {
  const url: string;
  export default url;
}
