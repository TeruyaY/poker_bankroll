import { useParams, Link } from 'react-router-dom'
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
  const [bb_str, setBb_str] = useState('');
  const [memo, setMemo] = useState('');

  const [std, setStd] = useState('');
  const [handsPH, setHandsPH] = useState('');
  const [winrateP, setWinrateP] = useState('');

  const [winrate, setWinrate] = useState('---');
  const [hands, setHands] = useState('---');
  const [nWinrate70, setNWinrate70] = useState('---');
  const [pWinrate70, setPWinrate70] = useState('---');
  const [nWinrate95, setNWinrate95] = useState('---');
  const [pWinrate95, setPWinrate95] = useState('---');
  const [probAbove, setProbAbove] = useState('---');
  

  const z_score70 = 1.036
  const z_score95 = 1.96

  const loadSessions = async () => {
    try {
      const response = await api.get(`/player/${playerId}/sessions`);
      setSessions(response.data);
    }  catch(error) {
      console.error("取得失敗:", error);
    }
  };

  const handlePlayerForm = async (e) => {
    e.preventDefault();

    try {
      await api.post(`/player/${playerId}/session`, {
        date: date,
        location: location,
        game_type: game_type,
        bb_str: bb_str,
        memo: memo
      });

      setDate('');
      setLocation('');
      setGame_type('');
      setBb_str('');
      setMemo('');

      loadSessions();
      alert("登録に成功しました！");
    } catch (error) {
      console.error("登録失敗:", error);
      alert("登録に失敗しました。");
    }
        
  };

  // 誤差関数 (erf) の近似式
  const erf = (x) => {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = (x < 0) ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  const handleCalculateForm = async (e) => {
    e.preventDefault();

    // 1. 入力値を数値化（計算用の一時変数に格納）
    const h = Number(hours);
    const hPH = Number(handsPH);
    const wb = Number(winBb);
    const s = Number(std);
    const wp = Number(winrateP);

    // 2. 依存関係のある計算を順番に行う
    const currentHands = h * hPH;
    if (currentHands <= 0) return; // 0除算防止

    const currentWinrate = (wb / currentHands) * 100;

    // 3. 統計計算
    const se = s / Math.sqrt(currentHands / 100);
    const error70 = z_score70 * se;
    const error95 = z_score95 * se;

    // 4. Zスコアと確率（真のWinrate > 予測値 となる確率）
    const z = (currentWinrate - wp) / se;
    const prob = 0.5 * (1 + erf(z / Math.sqrt(2)));

    // 5. 最後にまとめてStateを更新
    setHands(currentHands);
    setWinrate(Number(currentWinrate.toPrecision(3)));
    setNWinrate70(Number((currentWinrate-error70).toPrecision(3)));
    setPWinrate70(Number((currentWinrate+error70).toPrecision(3)));
    setNWinrate95(Number((currentWinrate-error95).toPrecision(3)));
    setPWinrate95(Number((currentWinrate+error95).toPrecision(3)));
    setProbAbove(Number(prob.toPrecision(3))); 


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

  const prepareBbChartData = () => {
    let cumulativeProfit = 0;
    let cumulativeHours = 0;

    const chartData = [{hours: 0, profit: 0}];

    for (const s of sessions) {
      cumulativeProfit += (s.cash_out - s.buy_in) / s.bb_str;
      cumulativeHours += (s.duration_hours || 0);

      chartData.push({
        hours: Number(cumulativeHours.toFixed(1)),
        profit: cumulativeProfit,
        dateL: s.date
      })
    }

    return [chartData, cumulativeHours, cumulativeProfit];
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

  const [bbChartData, hours, winBb] = prepareBbChartData();


  return (
    <Container maxWidth="lg" sx={{ px: { xs: 5, md: 7 } }}>
      <Grid container spacing={3} disableEqualOverflow>

        <Grid size={{ xs:12, md:12 }}>
          <Typography variant="h3" sx={{m:3}}>プレイヤーID: {playerId} のページ</Typography>
        </Grid>

        <Grid size={{ xs:12, md:8 }}>
          {/* 2. グラフの表示エリア */}
          <Card sx={{height:500, p: 3}}>
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
          <Card sx={{height:500, p:3}}>
            <Stack spacing={2} sx={{ height: '100%'}} component="form" onSubmit={handlePlayerForm} justifyContent="space-between">
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
                label="1BB/STR"
                placeholder="3"
                value={bb_str}
                onChange={(e) =>setBb_str(e.target.value)}
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
                          <Button
                            component={Link} 
                            to={`/sessions/${session.id}`}
                          >移動</Button>
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

        <Grid size={{xs:12, md:12}}>
          <Card sx={{p:3}}>
            <Typography variant="h4">計算</Typography>
            <Grid container spacing={2}>

              <Grid size={{xs:12, md:8}}>
                <Box sx={{height:400, p: 3}}>
                  <Stack spacing={4} sx={{ height: '100%'}}>
                    <Typography variant="h5">BB/STR収支グラフ</Typography>
                    <Box sx={{ flexGrow: 1, minHeight: 0}}>
                      <ResponsiveContainer>
                        <LineChart data={bbChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="hours" type="number" domain={[0, 'dataMax + 1']} tickCount={5}/>
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="profit" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Stack>
                </Box>
              </Grid>

              <Grid size={{xs:12, md:4}}>
                <Box sx={{height:400, p:3}}>
                  <Stack spacing={2} sx={{ height: '100%'}} component="form" onSubmit={handleCalculateForm} justifyContent="space-between">

                    <TextField
                      type="text"
                      label="標準偏差"
                      placeholder="3"
                      value={std}
                      onChange={(e) =>setStd(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />

                    <TextField
                      type="text"
                      label="1時間当たりのハンド数"
                      placeholder="3"
                      value={handsPH}
                      onChange={(e) =>setHandsPH(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />

                    <TextField
                      type="text"
                      label="予想ウィンレート"
                      placeholder="3"
                      value={winrateP}
                      onChange={(e) =>setWinrateP(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                    
                    <Button type="submit">登録</Button>
                  </Stack>
                </Box>
              </Grid>

              <Grid size={{xs:12}}>
                <Box sx={{height:500, p:3}}>
                  <Stack spacing={2} sx={{ height: '100%'}} component="form" onSubmit={handleCalculateForm} justifyContent="space-between">
                    <Typography variant="h6">プレイ時間: {hours}</Typography>
                    <Typography variant="h6">ハンド数: {hands}</Typography>
                    <Typography varaint="h6">ウィンレート: {winrate} BB/100</Typography>
                    <Typography varaint="h6">70%信頼区間: [ {nWinrate70} , {pWinrate70} ] BB/100</Typography>
                    <Typography varaint="h6">95%信頼区間: [ {nWinrate95} , {pWinrate95} ] BB/100</Typography>
                    <Typography varaint="h6">真のウィンレートが予想ウィンレートを上回っている確率: {probAbove}</Typography>
                    <Typography varaint="h6">破産確率5%以下にするのに必要な最低バンクロール</Typography>
                  </Stack>
                </Box>
              </Grid>

            </Grid>
          </Card>
        </Grid>
        
      </Grid>
    </Container>
  )
}

export default PlayerDetail