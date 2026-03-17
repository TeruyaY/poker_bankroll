import { useState, useEffect } from 'react'
import api from '../api'
import '../App.css'
import { Link } from 'react-router-dom';


import { 
  Grid, 
  Card, 
  Stack, 
  Typography, 
  Box, 
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button
} from '@mui/material';


function Home() {
  // ①【記憶の層】 (State)
  // 「今、画面に表示すべきデータは何？」を覚えている場所
  const [players, setPlayers] = useState([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // ②【行動の層】 (Logic / Functions)
  // 「ボタンが押されたら何をする？」「サーバーからどうやってデータを取る？」を決める場所
  const loadPlayers = async () => {
        try {
          const response = await api.get('/players');
          setPlayers(response.data);
        }  catch(error) {
          console.error("取得失敗:", error);
        }
        
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        // バックエンドにデータ送る
        await api.post('/player', {
          player_name: name,
          email: email
        });

        //　成功したら入力欄を空にする
        setName('');
        setEmail('');

        //　リストを最新にする
        loadPlayers();
        alert("登録に成功しました！");
    } catch (error) {
      console.error("登録失敗:", error);
      alert("登録に失敗しました。");
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  // ③【見た目の層】 (Return / JSX)
  // 「最終的にどんなHTMLを表示する？」を記述する場所
  return (
    <Container maxWidth="lg" sx={{ px: { xs: 5, md: 7 }, pb: 4 }}>
      <Grid container spacing={3} disableEqualOverflow>

        <Grid size={{ xs:12, md:12 }}>
          <Typography variant="h3" sx={{m:3}}>ポーカー収支管理</Typography>
        </Grid>

        <Grid size={{ xs:12, md:12 }}>
          <Card sx={{ minHeight: 250, p: { xs: 2, sm: 3, md: 5 } }}>
            <Stack spacing={2} sx={{ height: '100%'}} component="form" onSubmit={handleSubmit} justifyContent="space-between">
              <Typography variant="h4" sx={{m:3}}>プレイヤー新規登録</Typography>
                <TextField 
                  type="text" 
                  label="プレイヤー名" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  InputLabelProps={{
                  shrink: true,
                }}
                />
                <TextField
                  type="email" 
                  label="メールアドレス" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  InputLabelProps={{
                  shrink: true,
                }}
                />
                <Button type="submit"
                  variant="contained" 
                  size="large"
                  sx={{ mt: 1 }}>登録</Button>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 12 }}>
          <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h4" sx={{ mb: 2 }}>プレイヤー一覧</Typography>

            {/* --- 【1】スマホ用：カード形式リスト (md 未満で表示) --- */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {players.map((player) => (
                <Card 
                  key={player.id} 
                  variant="outlined" 
                  sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: '#fafafa' }}
                >
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">プレイヤー名</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{player.player_name}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" color="text.secondary">メールアドレス</Typography>
                      <Typography variant="body2">{player.email}</Typography>
                    </Box>

                    <Button 
                      fullWidth 
                      variant="contained" 
                      component={Link} 
                      to={`/players/${player.id}`}
                      size="small"
                      sx={{ mt: 1 }}
                    >
                      詳細・記録へ移動
                    </Button>
                  </Stack>
                </Card>
              ))}
            </Box>

            {/* --- 【2】PC用：従来のテーブル形式 (md 以上で表示) --- */}
            <TableContainer 
              component={Paper} 
              sx={{ 
                display: { xs: 'none', md: 'block' }, // スマホでは消す
                boxShadow: 2, 
                borderRadius: 2 
              }}
            >
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>プレイヤー名</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>メール</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {players.map((player) => (
                    <TableRow key={player.id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                      <TableCell>{player.player_name}</TableCell>
                      <TableCell align="right">{player.email}</TableCell>
                      <TableCell align="right">
                        <Button component={Link} to={`/players/${player.id}`}>移動</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
          </Card>
        </Grid>

      </Grid>
    </Container>
  );
}

export default Home
