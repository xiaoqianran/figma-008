/// <reference types="vite/client" />

// Allow importing CSS files (Vite + Tailwind)
declare module '*.css' {
  const content: string;
  export default content;
}
