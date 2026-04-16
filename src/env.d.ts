/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    onActiveBlockChanged: (callback: (data: any) => void) => void;
    onFileOpened: (callback: (data: { content: string, filePath: string }) => void) => void;
  }
}
