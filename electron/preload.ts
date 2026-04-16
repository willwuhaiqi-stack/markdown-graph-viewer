import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // basic api for future use
  onActiveBlockChanged: (callback: (data: any) => void) => ipcRenderer.on('active-block-changed', (_event, value) => callback(value)),
  onFileOpened: (callback: (data: { content: string, filePath: string }) => void) => ipcRenderer.on('file-opened', (_event, value) => callback(value)),
});
