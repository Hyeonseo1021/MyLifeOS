import { useState } from 'react'

function App() {
  const [input, setInput] = useState('')

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
      
      <div className="h-10 bg-gray-800 flex items-center justify-between px-4 draggable-area cursor-move">
        <span className="text-sm font-bold text-gray-400">MLO</span>
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 cursor-pointer"></div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div className="bg-gray-800 p-3 rounded-lg max-w-[80%]">
          안녕하세요! 무엇을 기억해 둘까요?
        </div>
      </div>

      <div className="p-4 bg-gray-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 메모하거나 질문하세요..."
          className="w-full bg-gray-700 text-white rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}

export default App