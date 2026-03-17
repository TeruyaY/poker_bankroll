import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PlayerDetail from './pages/PlayerDetail'
import SessionDetail from './pages/SessionDetail'


// MUIのテーマ関連をインポート
import { createTheme, responsiveFontSizes, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// 1. テーマを作成
let theme = createTheme({
  typography: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    // ここでベースのフォントサイズなどを調整することも可能です
  },
  // 必要に応じて色などのカスタムもここで
});

const lightTheme = createTheme({

  typography: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    // ここでベースのフォントサイズなどを調整することも可能です
  },

  palette: {
    mode: 'light',
    primary: {
      main: '#2962ff', // 鮮やかなブルー
    },
    background: {
      default: '#f0f2f5', // Facebookのような薄いグレーがかった白
      paper: '#ffffff',
    },
    success: {
      main: '#2e7d32', // プラス収支用
    },
    error: {
      main: '#d32f2f', // マイナス収支用
    },
  },
  shape: {
    borderRadius: 12, // 角を丸くすると一気にモダンになります
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e676', // 鮮やかなグリーン（ポーカーテーブルの色）
    },
    secondary: {
      main: '#ffab00', // ゴールド
    },
    background: {
      default: '#121212', // 深い黒
      paper: '#1e1e1e',   // カードなどの背景
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
  },
});

// 2. テーマをレスポンシブ化（h3などのフォントサイズが自動調整される魔法の一行）
theme = responsiveFontSizes(lightTheme);

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaselineはブラウザ独自のスタイルをリセットし、MUIの背景色やフォントを適用します */}
      <CssBaseline />
        <Routes>
          {/* 「/」にアクセスしたら Home コンポーネントを表示 */}
          <Route path="/" element={<Home />} />
          
          {/* 「/players/数字」にアクセスしたら PlayerDetail を表示 */}
          <Route path="/players/:playerId" element={<PlayerDetail />} />
          <Route path="/sessions/:sessionId" element={<SessionDetail />} />
        </Routes>
    </ThemeProvider>
  )
}

export default App