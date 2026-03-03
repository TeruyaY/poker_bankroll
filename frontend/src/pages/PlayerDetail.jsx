import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function PlayerDetail() {
  // URLの「:playerId」の部分を抜き出す
  const { playerId } = useParams();

  const [sessions, setSessions] = useState([]);
    
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [game_type, setGame_type] = useState('');
  const [memo, setMemo] = useState('');

  const loadSessions = async () => {
    try {
      const response = await api.get(`/player/${playerId}/sessions`);
      setSessions(response.data);
    }  catch(error) {
      console.error("取得失敗:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post(`/player/${playerId}/session`, {
        date: date,
        location: location,
        game_type: game_type,
        memo: memo
      });

      setDate('');
      setLocation('');
      setGame_type('');
      setMemo('');

      loadSessions();
      alert("登録に成功しました！");
    } catch (error) {
      console.error("登録失敗:", error);
      alert("登録に失敗しました。");
    }
        
  };

  useEffect(() => {
      loadSessions();
  }, []);

  const prepareChartData = () => {
    let cumulativeProfit = 0;
    let cumulativeHours = 0;

    const chartData = [{hours: 0, profit: 0}];

    for (const s of sessions) {
      cumulativeProfit += (s.cash_out - s.buy_in);
      cumulativeHours += (s.duration_hours || 0);

      chartData.push({
        hours: Number(cumulativeHours.toFixed(1)),
        profit: cumulativeProfit,
        dateL: s.date
      })
    }

    return chartData;
  };

  const handleDelete = async (id) => {
      if (!window.confirm("このデータを削除してもよろしいですか？")) return;
  
      try {
        await api.delete(`/session/${id}`);
        loadSessions();
      } catch (error) {
        console.error("削除に失敗しました", error);
      }
  
  };

  const chartData = prepareChartData();


  return (
    <Container maxWidth="lg" sx={{ px: { xs: 5, md: 7 } }}>
      <Grid container spacing={3} disableEqualOverflow>

        <Grid size={{ xs:12, md:12 }}>
          <Typography variant="h3" sx={{m:3}}>プレイヤーID: {playerId} のページ</Typography>
        </Grid>

        <Grid size={{ xs:12, md:8 }}>
          {/* 2. グラフの表示エリア */}
          <Card sx={{height:400, p: 3}}>
            <Stack spacing={4} sx={{ height: '100%'}}>
              <Typography variant="h4">プレイヤー収支グラフ</Typography>
              <Box sx={{ flexGrow: 1, minHeight: 0}}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hours" type="number" domain={[0, 'dataMax + 1']} tickCount={5}/>
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="profit" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs:12, md:4 }}>
          <Card sx={{height:400, p:3}}>
            <Stack spacing={2} sx={{ height: '100%'}} component="form" onSubmit={handleSubmit} justifyContent="space-between">
              <Typography variant="h4">セッション登録</Typography>
              <TextField
                type="date"
                label="日付"
                value={date}
                onChange={(e) =>setDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                type="text"
                label="場所"
                placeholder="Aria"
                value={location}
                onChange={(e) =>setLocation(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                type="text"
                label="ゲームの種類"
                placeholder="NLH1-3"
                value={game_type}
                onChange={(e) =>setGame_type(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                type="text"
                label="メモ"
                value={memo}
                onChange={(e) =>setMemo(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <Button type="submit">登録</Button>
            </Stack>
          </Card>  
        </Grid>

        <Grid size={{xs:12, md:12}}>
          <Card sx={{p:3}}>
            <Typography variant="h4">セッション一覧</Typography>
        
            <TableContainer component={Paper} sx={{ mt: 3, boxShadow: 2, borderRadius: 2 }}>
              <Table sx={{ minWidth: 300 }} aria-label="session table">
                <TableHead sx={{ backgroundColor: '#f5f5f5'}}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>日付</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold'}}>場所</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold'}}>ゲームの種類</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold'}}>メモ</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold'}}>操作</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {sessions.map((session) => {

                    return (
                      <TableRow
                        key={session.id}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          '&:hover': { backgroundColor: '#f9f9f9' }
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {session.date.toLocaleString()}
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {session.location.toLocaleString()}
                        </TableCell>
                        
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {session.buy_in.toLocaleString()}
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {session.cash_out.toLocaleString()}
                        </TableCell>

                        <TableCell align="right">
                          <IconButton 
                            aria-label="delete" 
                            color="error" // 🌟 これで赤くなります
                            onClick={() => handleDelete(session.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>

                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
        
      </Grid>
    </Container>
  )
}

export default PlayerDetail