# 準備

## ファイル作成
* backend folder
    * .env.back
    * .env.back.example
* frontend folder
    * .env.front
    * .env.front.example
* .gitignore
* dev_log.md
* LICENSE
* README.ja.md
* README.md

## Backend仮想環境を構築

### なぜバックエンドだけか？
* Node.jsは標準でプロジェクトごとに隔離された環境を作る
* フロントエンドとバックエンドは最終的に動く場所が違う
* 疎結合の原則

### 作成
```bash
cd backend
python3 -m venv .venv
```

### 有効化
```bash
source .venv/bin/activate
```
*注：Mac/Linux

### 主要ライブラリのインストール
```bash
pip install fastapi "uvicorn[standard]" pydantic python-dotenv
pip install tortoise-orm
```

* fastapi
* uvicorn：uvicorn だけを指定すると、ピュアなPythonで書かれた最小限の機能だけがインストールされます。しかし、[standard] を付けると、以下の強力なツールが自動的に追加されます。
    * uvloop: Python標準のイベントループをより高速なもの（libuvベース）に差し替えます。
    * httptools: HTTPの解析（パース）を高速に行います。
    * websockets: WebSocket通信をサポートします。
    * watchfiles: 開発中にコードを書き換えた際、自動でサーバーを再起動（リロード）する機能を提供します
* pydantic
* python-dotenv
* tortoise-orm

### requirements.txtの作成
```bash
pip freeze > requirements.txt
```

## バックエンドの動作確認
### main.pyを作成し簡単なGETエンドポイントを書く

backend内にmain.pyを作成し以下をコピペ：

```python
from fastapi import FastAPI

# FastAPIのインスタンスを作成
app = FastAPI()

# ルート（一番上の階層）へのGETリクエストを処理
@app.get("/")
def read_root():
    return {"Hello": "World", "Project": "Poker Profit Manager"}

# 動作確認用のテストエンドポイント
@app.get("/health")
def health_check():
    return {"status": "ok"}
```

### サーバー起動
```bash
uvicorn main:app --reload
```

### 動作確認
http://127.0.0.1:8000/docs

## Gitの初期化

### .gitignoreの更新
```text
# Python
.venv/
__pycache__/
*.py[cod]

# Node.js
node_modules/
dist/

# Env
.env
.env.back
.env.front

# OS
.DS_Store
```

### Gitリポジトリ作成
```bash
git init
```

### ステージングとコミット
```bash
# すべてのファイルを「保存対象」としてマーク
git add .

# 「Initial Commit（最初の保存）」として記録
git commit -m "Initial commit: project structure and basic FastAPI server"
```

### コミットとプッシュの違い
Gitには、大きく分けて2つの「保存」があります。

* コミット（Commit）: 自分のPC内にある履歴（リポジトリ）に保存すること。これだけで「過去の状態に戻す」ことは可能です。
* プッシュ（Push）: **外部のサーバー（GitHubなど）**に、自分のPCにある履歴をアップロードすること。

### プッシュ
もし、GitHubなどのリモートリポジトリを既に作成していて、「PCが壊れても大丈夫なようにバックアップしたい」、あるいは**「他の人と共有したい」**という場合はプッシュが必要です。

1. GitHub上で新しくリポジトリ（poker_bankroll）を作成する。

2. 表示されたURLを自分のPCに登録する：

```bash
git remote add origin <GitHubのURL>
```

3. アップロードする

```bash
git branch -M main
git push -u origin main
```

# データベースの設計と作成
## インポート
```python
from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator
```

## DBモデルの作成
```python
from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator

class DBモデル名(models.Model):
    # 【主キー】各データを一意に識別するID。自動で1, 2, 3...と増える
    id = fields.IntField(pk=True)

    # 【日付】2026-02-09 のような日付のみ
    date_field = fields.DateField(description="説明（APIドキュメント等に反映）")

    # 【文字列】短いテキスト。max_lengthで最大文字数を指定（必須）
    char_field = fields.CharField(max_length=255, description="場所や名前など")

    # 【数値】整数。金額やスタック数など
    int_field = fields.IntField(description="バイイン額やチップ量")

    # 【日時】2026-02-09 15:30:00 のような時刻を含むデータ
    datetime_field = fields.DatetimeField(description="記録された正確な時刻")

    # 【外部キー】親子関係を作る。
    # 'models.親モデル名' で指定し、related_nameは親から子を呼ぶ時の名前（例: 'intervals'）
    parent = fields.ForeignKeyField('models.親モデル名', related_name="children")

    # 【長文テキスト】メモや反省点など、文字数が決まっていない長い文章。
    # null=True をつけると「空欄」を許可する
    text_field = fields.TextField(null=True, description="詳細なメモ")

    # 【論理値】True または False（例：終了したセッションかどうか）
    # bool_field = fields.BooleanField(default=False)

    class Meta:
        # 実際にデータベース内に作られるテーブルの名前（基本は複数形）
        table = "テーブル名"
```

1. pk=True: Primary Key（主キー）のことです。これが無いとデータベースが「どの行を更新すればいいか」分からなくなるため、必ず一つ必要です。
2. default=0: IntField などで、値が入力されなかった時に自動で 0 を入れる設定です。リバイ額（add_on_amount）などによく使います。
3. related_name の重要性: 例えば Session から見て、紐づいている Interval たちを session.intervals のように取得できるようにするための「呼び名」です。
4. auto_now_add=True: DatetimeField に追加できる便利な設定で、データが作成された瞬間の時刻を自動で記録してくれます。
5. 外部キー：Playerが削除されたらそのセッションも消すなら on_delete=fields.CASCADE を追加検討

## Pydantic Modelの作成
### Pydantic Modelとは
一言で言うと、**「データの玄関口でのチェック（バリデーション）」**を担当するモデルです。

* Tortoise（models.py）: 「データベースにどう保存するか」を決める。
* Pydantic: 「APIでデータを受け取ったり送ったりする時に、データの形が正しいか」をチェックする。

もしPydanticを使わず、データベースのモデルをそのままAPIで返そうとすると、以下のような不都合が起きます。

* **機密情報の流出:** プレイヤーのメールアドレスをAPIで返したくないのに、DBモデルをそのまま使うと全部送られてしまう。

* **循環参照エラー:** 「プレイヤー ⇄ セッション」のように親子で繋がっている場合、そのまま返そうとすると無限ループに陥ってエラーになることがあります。

### 2つのモデル
1. 無印のモデル（例: Player）
* 役割: 「出力（レスポンス）」用
* 中身: データベースにあるすべての項目（id や、もしあれば created_at など）を含みます。
* 用途: ブラウザにデータを送って画面に表示させる時に使います。

2. "In" モデル（例: PlayerIn / exclude_readonly=True）
* 役割: 「入力（リクエスト）」用
* 中身: データベースが自動で決める項目（読み取り専用＝readonly）を除外したものです。
* 用途: ユーザーから新規登録データを受け取る時に使います。

### 1つしかなかったら
例えば、Player を登録するAPIを「無印モデル」だけで作ろうとすると、こうなります。

問題: APIが「新しいプレイヤーを登録するなら id も送ってください」と要求してしまいます。

現実: id はデータベースが自動で 1, 2, 3... と割り振るものなので、ユーザー（フロントエンド）側は何を送ればいいか分かりません。

ここで exclude_readonly=True を指定した In モデルを使うことで、**「id はこっちでやるから、それ以外の名前やメールだけ送ってね」**というスマートな窓口が作れるのです。

### 例
```python
X_Pydantic = pydantic_model_creator(X, name="X")
X_PydanticIn = pydantic_mdoel_creator(X, name="XIn", exclude_readonly=True)
```

## Tortoise ORMの紐づけ設定
FastAPIとデータベースをつなげよう。

### データベースのURLの設定
```python
import os
from dotenv import load_dotenv

load_dotenv(".env.back")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite://db.sqlite3") # なければSQLite

register_tortoise(
    app,
    db_url=DATABASE_URL,
    # ... 他の設定
)
```

環境変数からPostgreSQLサーバーにあるデータベースのＵＲＬを取得する。開発段階ではSQLiteで代用。

### 紐づけ
```python
from fastapi import FastAPI
from tortoise.contrib.fastapi import register_tortoise
# models.pyからモデルやPydanticモデルをインポート
from models import Player, Player_Pydantic, Player_PydanticIn ...

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Poker Bankroll API is running"}

#.....続いていく

# --- ここが重要：Tortoise ORMの紐付け設定 ---
register_tortoise(
    app,
    db_url=DATABASE_URL,          # データベースファイルの保存先と名前
    modules={"models": ["models"]},         # モデルが定義されているファイル名
    generate_schemas=True,                 # 起動時にテーブルがなければ自動作成する
    add_exception_handlers=True,           # データベース関連のエラーを分かりやすく表示する
)
```

### スキーマ
本番環境で毎回 generate_schemas=True にしておくのは、少し注意が必要です。

* 理由: 本番で稼働中にテーブル構造を少し変えたくなったとき、この設定だけでは「すでにあるデータ」を壊さずに構造を変えることが難しいからです。
* 本番の理想: Aerich というマイグレーションツールを使い、履歴を管理しながら変更するのがエンジニアの標準的な手法です。

## データベース生成
```bash
uvicorn main:app --reload
```
db.sqlite3ができる。

.gitignoreに生成されたファイル書き足す

```text
# SQLite データベース本体
backend/db.sqlite3

# 前に説明した一時ファイル（WALモード用）もまとめて除外
backend/db.sqlite3-shm
backend/db.sqlite3-wal
```

# バックエンドでCRUD操作
## エンドポイントとは
エンドポイント ＝ APIの機能ごとに割り振られた専用URL。
プログラミングをする時は、「どのURLに、どんな命令（GET/POSTなど）が来たら、どんな処理をするか」をエンドポイントごとに設計していきます。

| メソッド | URL(エンドポイント) | 役割 |
| --- | --- | --- |
| GET | /players | プレイヤーの一覧を取得 |
| POST | /players | 新プレイヤーの登録 |
| GET | /sessions | セッションの一覧を取得 |

## POST - Create

```python
from fastapi import HTTPException

@app.post("/xxx", respnse_model=Xxx_Pydantic)
aync def create_xxx(xxx: Xxx_PydanticIn):
    # 1. データベースに保存(Xxxオブジェクトを作成)
    # **xxx.dict()でPydanticモデルを辞書形式に展開して渡す
    xxx_obj = await Xxx.create(**xxx.dict(exclude_unset=True))

    # 2. 保存されたデータをID付きのPydanticモデル形式で返す
    return await Xxx_Pydantic.from_tortoise_orm(player_obj)
```

### exclude_unset=Trueとは
「ユーザーが実際に送ってきたデータだけを辞書にする」という設定です。

* **なぜ必要か：** Pydanticモデルには「デフォルト値」を設定することがあります。もしこれを使わないと、ユーザーが送っていない項目まで「デフォルト値」としてデータベースに上書きされてしまう可能性があります。

* **効果：** 「送られてきたものだけを更新・登録する」という安全な挙動になります。

### Xxxオブジェクトとは
**「データベースの1行分を、Pythonのプログラムで扱いやすい『塊』にしたもの」**です。

* データベース: id | name | email というただの文字と数字の並び。
* Python（オブジェクト）: player.player_name と打てば名前が取れるし、player.save() と打てば保存できる。
* 役割: データベースの生データを、プログラムが理解できる「意味のある実体」に変換したものがオブジェクトです。

### なぜawait

**「待ち時間に他の仕事ができるようにするため」です。これを非同期処理**と呼びます。

データベースへの読み書きは、コンピュータの計算速度に比べると「めちゃくちゃ時間がかかる作業」です。

* await なし: データベースの返事があるまで、サーバー全体がフリーズして他の人のリクエストを無視します。

* await あり: 「データベースの結果を待っている間、他の人のリクエストもさばいてていいよ！」と指示を出します。

FastAPIとTortoise ORMは、この「効率的な待ち方」が得意なので、大量のアクセスがあってもサクサク動くのです。

### 最後のreturn
そこで from_tortoise_orm を使うことで、以下の変換を行っています。

* **型変換:** 複雑なオブジェクトから、純粋なデータ（辞書のような形式）へ変換。

* **IDの確定:** データベースが自動で割り振った id を取り込んで、Pydanticモデルにセットする。

* **整形:** 設定したスキーマに合わせて、不要な情報を削ぎ落とす。

## GET - Read
### Lisrインポート
```python
from typing import List
```

### 例
```python
@app.get("/players", response_model=List[Player_Pydantic])
async def get_players():
    # Player.all() で全データを取得し、Pydanticモデルのリストに変換
    return await Player_Pydantic.from_queryset(Player.all())
```

### Player_Pydantic.from_queryset(Player.all())について

####　Player.all()はクエリの作成

これは Tortoise ORM に対する命令です。

* 発行されるSQL: 裏側で SELECT * FROM players; というSQL文を生成しています。
* 状態: この時点ではまだデータベースには命令を飛ばしていません。「全データを取る準備ができた」という予約の状態（クエリセット）です

#### Player_Pydantic.from_queryset(...) （実行と変換）

これが Tortoise ORM の非常に便利な「合わせ技」です。

* 実行: ここで初めて await（または内部的な実行）を伴い、データベースにクエリを投げます。
* 変換: データベースから返ってきた「生の行データ（オブジェクト）」を、自動的に Player_Pydantic という「APIで返せる形」に変換して、さらにそれを List（配列） に詰め込んでくれます。

#### なぜ from_tortoise_ormじゃないか
* from_tortoise_orm:　1つのデータを変換するとき
* from_queryset:　たくさんのデータ(クエリ結果)を変換するとき

### 確認
uvicornで実行して動作確認しよう

## DELETE
```python
# プレイヤーを削除する
@app.delete("/player/{player_id}")
async def delete_player(player_id: int):
    # 1. 指定されたIDのプレイヤーを探して削除する
    # .filter(id=player_id).delete() で一気に削除可能です
    deleted_count = await Player.filter(id=player_id).delete()
    
    # 2. もし削除された件数が0なら、そのIDは存在しないのでエラーを返す
    if not deleted_count:
        raise HTTPException(status_code=404, detail=f"Player {player_id} not found")
    
    # 3. 削除成功のメッセージを返す
    return {"status": "ok", "message": f"Deleted player {player_id}"}
```

## POST 子
### 例
```python
@app.post("/parent/{parent_id}/children", response_mode=Children_Pydantic)
async def create_children(parent_id:int, children_info: Session_PydanticIn):
    # 1. check if parent exists (gives 404 error if no parent)
    parent = await Parent.get(id=parent_id)

    # 2. Create child
    children_obj = await Children.create(
        **children_info.dict(exclide_unset=True),
        parent=parent
    )

    # 3. 保存したデータのJSON形式を返す
    return await Children_Pydantic.from_tortoise_orm(parent_obj)
```

# CORS (Cross-Origin Resource Sharing)
## なぜ必要
ブラウザには**「同じオリジン（URLのドメイン・ポート番号）同士でしか通信させない」**という、同一オリジンポリシーという鉄の掟があります。

* React: http://localhost:3000

* FastAPI: http://localhost:8000

ポート番号が違うだけで「別のサイト」とみなされるため、ブラウザが「勝手に別のサーバーのデータを盗もうとしていないか？」と疑って、通信をブロックしてしまうのです。

CORS設定は、バックエンド側から**「このフロントエンド（3000番）からのアクセスは信頼できるから許可してね！」**とブラウザに許可証を出す作業になります。

## 例
```python
from fastapi.middleware.cors import CORSMiddleware # インポートが必要

app = FastAPI()

# --- CORS設定の追加 ---
origins = [
    "http://localhost:3000", # React(標準)
    "http://localhost:5173", # Vite(最近の主流)
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # 許可するオリジンのリスト
    allow_credentials=True,     # クッキーや認証情報の共有を許すか
    allow_methods=["*"],        # すべてのメソッド（GET, POST, DELETE等）を許可
    allow_headers=["*"],        # すべてのヘッダーを許可
)
```

# Frontend準備
## プロジェクトの作成

現在のダミーのフロントエンドを改名(例：frontend_draft)

```bash
npm create vite@latest frontend -- --template react
```
* Select a framework: React
* Select a variant: JavaScript

## 初期設定と起動
```bash
cd frontend
npm install
npm run dev
```

.env.frontと.env.front.exampleをfrontend直下に移動

frontend内の.gitignoreに以下を追加

```text
# env
.env
.env.front
```

frontend内のREADME.md削除

## axiosのインストール
```bash
npm install axios
```

### axiosのメリット
fetch よりも axios が好まれる理由は、「気が利く（自動でやってくれることが多い）」 からです。

* JSONへの自動変換: fetch はデータを送受信する際に JSON.stringify() したり response.json() したりする必要がありますが、axios は自動でやってくれます。

* エラーハンドリング: HTTPエラー（404や500など）が起きたとき、fetch はエラーとして扱ってくれませんが、axios は自動で catch ブロックに飛ばしてくれます。

* 書きやすさ: メソッド名（.get, .post, .delete）が直感的です。

## api.jsの作成
axios の設定を一箇所にまとめた api.js（共通設定ファイル） を作っておくと、将来的にサーバーのURLが変わったときも、このファイルを1箇所直すだけでアプリ全体が更新されます。

frontend/src フォルダの中に api.js というファイルを新規作成し、以下のコードを貼り付けてください。

```JavaScript
import axios from 'axios';

// 1. axiosの共通設定（インスタンス）を作成
const api = axios.create({
  // 環境変数からURLを取得（Viteのルール：import.meta.env）
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. 共通のエラーハンドリング（任意）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API通信でエラーが発生しました:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
```

### .envの調整
1. .env.frontと.env.front.exampleを.envと.env.exampleに変える。

2. .gitignoreも適宜変える。
3. .envに以下を追加

### App.jsxでの使い方
```JavaScript
import api from './api'; // 自分の作った設定を読み込む

// 以前：axios.get('http://localhost:8000/players')
// これから：
const response = await api.get('/players'); // baseURLが自動で補完される！
```

# Frontend基盤構築
## Appの解説
### なぜ必要
普通のHTMLファイルは、一度書いたらその文字は変わりません。しかし、ポーカーアプリでは「登録ボタンを押したらリストが増える」という動きが必要です。
App 関数は、「今、データがどうなっているか（State）」 を見張り、データが変わった瞬間に 「画面を書き直せ！」 とブラウザに命令を出すために存在しています。

### 3層
```JavaScript
function App() {
  // ①【記憶の層】 (State)
  // 「今、画面に表示すべきデータは何？」を覚えている場所

  // ②【行動の層】 (Logic / Functions)
  // 「ボタンが押されたら何をする？」「サーバーからどうやってデータを取る？」を決める場所

  // ③【見た目の層】 (Return / JSX)
  // 「最終的にどんなHTMLを表示する？」を記述する場所
}
```

### App実行の流れ
App 関数の中で最も重要なのが、「Stateが変わると、関数がもう一度最初から実行される」 という仕組みです。

1. 初期状態: players は空っぽ []。App が動いて「空のリスト」を表示する。

2. 行動: fetchPlayers が動いて、サーバーから3人のデータを持ってきた。

3. 変化: setPlayers(データ) を呼ぶ。すると React が 「あ、データが変わったな！」 と気づく。

4. 再実行 (再レンダリング): React が勝手に App 関数をもう一度実行 する。

5. 最新の状態: 今度は players に3人入っているので、画面に3人の名前が並ぶ。

この「勝手に書き換わる」仕組みこそが、Reactの最大の特徴です。

### useState
一言で言うと：**「画面上で変化する『今の状態』を、Reactに覚えておいてもらうためのメモ帳」**です。

```JavaScript
const [abc, setAbc] = useState([]);
```

* abc は現在の値で今画面に映すべき「結果」。

* setAbc は値を更新する関数でReactに変化を伝える「リモコン」。

#### なぜ関数？
setAbc(2000) のように関数として実行することで、Reactは内部で以下のような高度な処理を安全に行うことができます。

1. 古い値と新しい値の比較: 「本当に値が変わったかな？ 1000から1000への更新なら、画面を書き換える無駄な仕事はやめよう」と判断して、動作を軽くしてくれます。

2. 更新のタイミング調整: 1秒間に100回更新命令が来ても、Reactが「ちょっと待って、まとめて1回で書き換えるよ」と、パソコンに負担がかからないように整理してくれます。

### useEffect
Reactの useEffect は、ひと言でいうと 「画面の表示や更新に連動して、裏側でコッソリ別の仕事をさせる予約ボタン」 です。

React初学者が最もつまずきやすい概念ですが、仕組みがわかれば「いつ、何をさせるか」を自由にコントロールできるようになります。

```JavaScript
useEffect(() => {
  // ① やりたい仕事（副作用）の中身
  console.log("仕事中...");

}, [/* ② 実行するタイミングの条件（依存配列） */]);
```

## プレイヤーの名前リスト表示
```JavaScript
import { useState, useEffect } from 'react'
import api from './api'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  // ①【記憶の層】 (State)
  // 「今、画面に表示すべきデータは何？」を覚えている場所

  // ②【行動の層】 (Logic / Functions)
  // 「ボタンが押されたら何をする？」「サーバーからどうやってデータを取る？」を決める場所

  // ③【見た目の層】 (Return / JSX)
  // 「最終的にどんなHTMLを表示する？」を記述する場所
}
```
を基に作る。

### 記憶の層
まずはプレイヤー情報を記憶する

```JavaScript
const [players, setPlayers] = useState([]);
```

### 行動の層
```JavaScript
useEffect(() => {
    const loadData = async () => {
        const response = await api.get('/players');
        setPlayers(response.data);
    };

    loadData();
}, []);
```

### 見た目の層
```JavaScript
return (
    <div>
      <h1>プレイヤー一覧</h1>
      <ul>
        {/* playersの中身を一つずつ取り出して <li> に変換する */}
        {players.map(player => (
            <li key={player.id}>
            {/* テンプレートリテラルを使うと綺麗に書けます */}
            <strong>{player.player_name}</strong> ： {player.email}
            </li>
        ))}
      </ul>
    </div>
);
```

### 起動確認
```bash
npm run dev
```

## プレイヤー登録フォームの実装
### 流れ
1. 入力: ユーザーがキーボードで文字を打つ。

2. 同期: 1文字打つたびに、Reactの useState（メモ帳）が書き換わる。

3. 送信: 登録ボタンが押されたら、axios（api.js）を使ってバックエンドにPOSTリクエストを送る。

4. 更新: 登録が成功したら、画面上のリストを最新の状態に更新する。

### 記憶の層
新たに入力されるプレイヤーの情報を記憶する

```JavaScript
const [name, setName] = useState('');
const [email, setEmail] = useState('');
```

### 行動の層
フォームのボタンが押された時の機能実装。
loadPlayersは再利用するためuseEffectの外に。

```JavaScript
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
```

* e.preventDefault()：HTMLのボタンを押すとページ全体を再読み込みする習性を抑制する
* const handleSubmit = async (e) => {}：(e)はfunction(e)の略でhandleSubmitはeを受け取って非同期処理を行う変わらない関数だよと宣言している

### 見た目の層

```JavaScript
<div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
    <h2>プレイヤー新規登録</h2>
    <form onSubmit={handleSubmit}>
        <input
            type="text"
            placeholder="プレイヤー名"
            value={name}
            onChange={(e) => setName(e.target.value)}
        />

        <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />

        <button type="submit">登録</button>
    </form>
</div>
```

inputのvalueとonChange
* value={name}：入力欄の文字の表示はnameというStateと同じにする
* onChange={(e) => setName(e.target.value)}：入力の瞬間にnameというStateを更新してね

1. 入力: ユーザーがキーボードの「T」を叩く。
2. 発火: onChange イベントが発生。
3. 抽出: e.target.value によって、今の入力欄の中身が "T" であることを突き止める。
4. 更新: setName("T") が実行され、Reactのメモ帳（State）が "T" になる。
5. 再描画: Stateが変わったので、Reactが App 関数をもう一度実行する。
6. 反映: value={name} の部分が value={"T"} として描画され、ユーザーの目には「T」と表示される。

** 画面上の入力欄」と「Reactの中の変数」 **を同期させたい!

# Frontend構造化とルーティング
## React Routerの導入
### インストール
```bash
npm install react-router-dom
```

###　main.jsxとApp.jsxの変更
main.jsx
```JavaScript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // 追加
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* ここで包むのがルール */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

App.jsx
```JavaScript
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PlayerDetail from './pages/PlayerDetail'

function App() {
  return (
    <Routes>
      {/* 「/」にアクセスしたら Home コンポーネントを表示 */}
      <Route path="/" element={<Home />} />
      
      {/* 「/players/数字」にアクセスしたら PlayerDetail を表示 */}
      <Route path="/players/:playerId" element={<PlayerDetail />} />
    </Routes>
  )
}

export default App
```

1.  <BrowserRouter>, <Routes>, <Route>
これらは3点セットで使います。

* BrowserRouter: 「URLを監視する装置」です。

* Routes: 「この中からURLに合うものを選んでね」という箱です。

* Route: 「もしURLが path と一致したら、element（部品）を表示してね」という指示書です。

2. パスパラメータ :playerId
URLの中に「穴」を開けておく書き方です。
この穴に入った値は、移動先のコンポーネントで useParams という魔法を使って取り出すことができます。

### Home.jsxへの引っ越し
App.jsxの内容をHome.jsxに引っ越す。
この時Home.jsxはsrc/pages/Home.jsxのようになる。

### PlayerDetail.jsxの作成
```JavaScript
// src/pages/PlayerDetail.jsx
import { useParams } from 'react-router-dom'

function PlayerDetail() {
  // URLの「:playerId」の部分を抜き出す
  const { playerId } = useParams();

  return (
    <div>
      <h2>プレイヤーID: {playerId} のページ</h2>
      <p>ここに、このプレイヤー専用のセッション登録フォームを作ります</p>
    </div>
  )
}
```

useParams は、React Routerが提供する非常に便利な「フック（機能）」で、「URLの中に含まれる動的な値」を、プログラム内で使える変数として取り出すためのツールです。

## コンポーネントの分割

# Frontend分析と視覚化
## グラフライブラリの導入

## 統計情報の表示

# ブラッシュアップ