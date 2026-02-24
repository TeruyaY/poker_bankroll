import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PlayerDetail from './pages/PlayerDetail'
import SessionDetail from './pages/SessionDetail'

function App() {
  return (
    <Routes>
      {/* 「/」にアクセスしたら Home コンポーネントを表示 */}
      <Route path="/" element={<Home />} />
      
      {/* 「/players/数字」にアクセスしたら PlayerDetail を表示 */}
      <Route path="/players/:playerId" element={<PlayerDetail />} />
      <Route path="/sessions/:sessionId" element={<SessionDetail />} />
    </Routes>
  )
}

export default App