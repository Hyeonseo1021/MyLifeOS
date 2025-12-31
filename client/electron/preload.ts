import { contextBridge, ipcRenderer } from 'electron'

// React에서 window.electron... 으로 접근할 수 있게 노출
contextBridge.exposeInMainWorld('electron', {
  // 예시: send: (channel: string, data: any) => ipcRenderer.send(channel, data),
})