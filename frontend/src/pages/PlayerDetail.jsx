import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
  Button,
  bottomNavigationActionClasses
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
  const [bbChartData, setBbChartData] = useState([{hands: 0, profit: 0, nError70: 0, pError70: 0, nError95: 0, pError95: 0}]);
  const [xBbDomain, setXBbDomain] = useState([0,100]);
  const [xBbTicks, setXBbTicks] = useState([0,50,100]);
  const [yBbDomain, setYBbDomain] = useState([0,100]);
  const [yBbTicks, setYBbTicks] = useState([0,50,100]);
  const [bacnkrollNeeded, setBankrollNeeded] = useState(0);

  const z_score70 = 1.036
  const z_score95 = 1.96
  const hUnit = 100;
  const resolution = 100;
  const ror=0.05;

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

    const currentWinrate = (wb / currentHands) * hUnit;

    // 3. 統計計算
    const se = s / Math.sqrt(currentHands / hUnit);
    const error70 = z_score70 * se;
    const error95 = z_score95 * se;

    // 4. Zスコアと確率（真のWinrate > 予測値 となる確率）
    const z = (currentWinrate - wp) / se;
    const prob = 0.5 * (1 + erf(z / Math.sqrt(2))) * 100;

    // 5. 必要バンクロール計算
    let bankroll;
    if (currentWinrate > 0) bankroll = Math.pow(s, 2) / (2 * currentWinrate) * Math.log(1/ror);
    else bankroll = '---'

    // 6. 最後にまとめてStateを更新
    setHands(currentHands);
    setWinrate(Number(currentWinrate.toPrecision(3)));
    setNWinrate70(Number((currentWinrate-error70).toPrecision(3)));
    setPWinrate70(Number((currentWinrate+error70).toPrecision(3)));
    setNWinrate95(Number((currentWinrate-error95).toPrecision(3)));
    setPWinrate95(Number((currentWinrate+error95).toPrecision(3)));
    setProbAbove(Number(prob.toPrecision(3))); 
    setBankrollNeeded(bankroll);
    prepareBbChartData(currentWinrate, hPH, s);

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

  const calculateXAxis = (data) => {
    const rawValues = [...data.map(d => d.hours), 
      ...data.map(d => d.hands)];
    const values = rawValues.filter( v=> typeof v === 'number' && !isNaN(v));
    return calculateAxis(values);
  }

  const calculateYAxis = (data) => {
    const rawValues = [...data.map(d => d.profit), 
      ...data.map(d => d.nError70), 
      ...data.map(d => d.pError70),
      ...data.map(d => d.nError95),
      ...data.map(d => d.pError95),];
    const values = rawValues.filter( v=> typeof v === 'number' && !isNaN(v));
    return calculateAxis(values);
  }

  const calculateAxis = (values) => {
    if (!values || values.length === 0) return [[0,100], [0, 50, 100]];

    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const range = dataMax - dataMin;

    const roughStep = range / 10;

    const exponent = Math.floor(Math.log10(roughStep));
    const magnitude = Math.pow(10, exponent);

    const normalizedStep = roughStep / magnitude;
    let step = 0;
    if (normalizedStep < 1.5) step = 1 * magnitude;
    else if (normalizedStep < 3.5) step = 2 * magnitude;
    else if (normalizedStep < 7.5) step = 5 * magnitude;
    else step = 10 * magnitude;

    const bottom = Math.floor(dataMin / step) * step;
    const top = Math.ceil(dataMax / step) * step;

    const ticks = [];
    for (let val = bottom; val <=top; val += step) {
      ticks.push(val);
    }

    return [[bottom, top], ticks];
  };

  const chartData = prepareChartData();
  const [xDomain, xTicks] = calculateXAxis(chartData);
  const [yDomain, yTicks] = calculateYAxis(chartData);

  const prepareCalculation = () => {
    let cumulativeBb = 0;
    let cumulativeHours = 0;

    for (const s of sessions) {
      cumulativeBb += (s.cash_out - s.buy_in) / s.bb_str;
      cumulativeHours += (s.duration_hours || 0);
    }

    return [cumulativeHours, cumulativeBb];
  };

  const prepareBbChartData = (wr, hPH, std) => {
    let cumulativeBb = 0;
    let cumulativeHands = 0;

    const chartData = [{hands: 0, profit: 0}];

    for (const s of sessions) {
      cumulativeBb += (s.cash_out - s.buy_in) / s.bb_str;
      cumulativeHands += (s.duration_hours *  hPH || 0);

      chartData.push({
        hands: Number(cumulativeHands.toFixed(1)),
        profit: cumulativeBb
      })
    }

    for (let i = 0; i < resolution; i++) {
      let x = cumulativeHands/resolution * i
      chartData.push({
        hands: x,
        nError70: wr / hUnit * x - z_score70 * std * Math.sqrt(x/hUnit),
        pError70: wr / hUnit * x + z_score70 * std * Math.sqrt(x/hUnit),
        nError95: wr / hUnit * x - z_score95 * std * Math.sqrt(x/hUnit),
        pError95: wr / hUnit * x + z_score95 * std * Math.sqrt(x/hUnit),
      })
    }

    setBbChartData(chartData);
    const [calculatedXDomain, calculatedXTicks] = calculateXAxis(chartData);
    setXBbDomain(calculatedXDomain);
    setXBbTicks(calculatedXTicks); 
    const [calculatedYDomain, calculatedYTicks] = calculateYAxis(chartData);
    setYBbDomain(calculatedYDomain);
    setYBbTicks(calculatedYTicks);
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

  const [hours, winBb] = prepareCalculation();


  return (
    <Container maxWidth="lg" sx={{ px: { xs: 5, md: 7 }, pb: 4}}>
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
                      <XAxis dataKey="hours" type="number" domain={xDomain} ticks={xTicks}/>
                      <YAxis domain={yDomain} ticks={yTicks} tickFormatter={(val) => val.toLocaleString()}/>
                      <Tooltip />
                      <Line type="linear" dataKey="profit" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} />
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
                    <TableCell align="right" sx={{ fontWeight: 'bold'}}>1BB/STR</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold'}}>バイイン額</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold'}}>キャッシュアウト額</TableCell>
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
                          {session.game_type.toLocaleString()}
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {session.bb_str.toLocaleString()}
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

              <Grid size={{xs:12, md:4}}>
                <Box sx={{height:500, p:3}}>
                  <Stack spacing={2} sx={{ height: '100%'}} component="form" onSubmit={handleCalculateForm} justifyContent="space-between">
                    <Typography variant="h5">分析ツール</Typography>

                    <Stack spacing={2}>
                      <TextField
                        type="text"
                        label="標準偏差"
                        placeholder="100"
                        value={std}
                        onChange={(e) =>setStd(e.target.value)}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                      <Stack spacing={1}>
                        <Typography variant="h7">NLH 9-max: 60-80 BB/100</Typography>
                        <Typography variant="h7">NLH 6-max: 75-120 BB/100</Typography>
                        <Typography variant="h7">PLO 9-max: 100-140 BB/100</Typography>
                        <Typography variant="h7">PLO 6-max: 120-160 BB/100</Typography>
                      </Stack>
                    </Stack>

                    <TextField
                      type="text"
                      label="1時間当たりのハンド数"
                      placeholder="20-30"
                      value={handsPH}
                      onChange={(e) =>setHandsPH(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />

                    <TextField
                      type="text"
                      label="予想ウィンレート"
                      placeholder="0"
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

              <Grid size={{xs:12, md:8}}>
                <Box sx={{height:550, p: 3}}>
                  <Stack spacing={4} sx={{ height: '100%'}}>
                    <Typography variant="h5">BB/STR収支グラフ</Typography>
                    <Box sx={{ flexGrow: 1, minHeight: 0}}>
                      <ResponsiveContainer>
                        <LineChart data={bbChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="hands" type="number" domain={xBbDomain} ticks={xBbTicks} tickFormatter={(val) => val.toLocaleString()}/>
                            <YAxis domain={yBbDomain} ticks={yBbTicks} tickFormatter={(val) => val.toLocaleString()}/>
                            <Tooltip />
                            <Legend />
                            <Line type="linear" dataKey="profit" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="nError70" stroke="#d88884" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="pError70" stroke="#d88884" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="nError95" stroke="#84d888" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="pError95" stroke="#84d888" strokeWidth={3} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Stack>
                </Box>
              </Grid>

              <Grid size={{xs:12}}>
                <Box sx={{height:500, p:3}}>
                  <Stack spacing={4} sx={{ height: '100%'}}>
                    <Typography variant="h5">分析結果</Typography>
                    <TableContainer component={Paper} sx={{ mt: 3, boxShadow: 2, borderRadius: 2 }}>
                      <Table sx={{ minWidth: 300 }} aria-label="session statistics table"> 
                        <TableBody>
                          {/* プレイ時間 */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>プレイ時間</TableCell>
                            <TableCell align="right">{hours} 時間</TableCell>
                          </TableRow>

                          {/* ハンド数 */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>ハンド数</TableCell>
                            <TableCell align="right">{hands.toLocaleString()} hands</TableCell>
                          </TableRow>

                          {/* ウィンレート */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>ウィンレート</TableCell>
                            <TableCell align="right" sx={{ color: winrate >= 0 ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                              {winrate} BB/{hUnit}
                            </TableCell>
                          </TableRow>

                          {/* 70%信頼区間 */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>70%信頼区間</TableCell>
                            <TableCell align="right">
                              [ {nWinrate70} , {pWinrate70} ] <Box component="span" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>BB/{hUnit}</Box>
                            </TableCell>
                          </TableRow>

                          {/* 95%信頼区間 */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>95%信頼区間</TableCell>
                            <TableCell align="right">
                              [ {nWinrate95} , {pWinrate95} ] <Box component="span" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>BB/{hUnit}</Box>
                            </TableCell>
                          </TableRow>

                          {/* 上回っている確率 */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>真のWRが予想を上回る確率</TableCell>
                            <TableCell align="right">{probAbove}%</TableCell>
                          </TableRow>

                          {/* 必要最低バンクロール */}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>必要最低バンクロール (RoB 5%)</TableCell>
                            <TableCell align="right" sx={{ fontSize: '1.1rem', color: 'primary.main', fontWeight: 'bold' }}>
                              {bacnkrollNeeded} BB
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
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