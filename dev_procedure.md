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