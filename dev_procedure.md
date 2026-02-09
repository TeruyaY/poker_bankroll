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

## データベースの設計と作成
### インポート
```python
from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator
```

### DBモデルの作成
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

### Pydantic Modelの作成
#### Pydantic Modelとは
一言で言うと、**「データの玄関口でのチェック（バリデーション）」**を担当するモデルです。

* Tortoise（models.py）: 「データベースにどう保存するか」を決める。
* Pydantic: 「APIでデータを受け取ったり送ったりする時に、データの形が正しいか」をチェックする。

もしPydanticを使わず、データベースのモデルをそのままAPIで返そうとすると、以下のような不都合が起きます。

* **機密情報の流出:** プレイヤーのメールアドレスをAPIで返したくないのに、DBモデルをそのまま使うと全部送られてしまう。

* **循環参照エラー:** 「プレイヤー ⇄ セッション」のように親子で繋がっている場合、そのまま返そうとすると無限ループに陥ってエラーになることがあります。

#### 2つのモデル
1. 無印のモデル（例: Player）
* 役割: 「出力（レスポンス）」用
* 中身: データベースにあるすべての項目（id や、もしあれば created_at など）を含みます。
* 用途: ブラウザにデータを送って画面に表示させる時に使います。

2. "In" モデル（例: PlayerIn / exclude_readonly=True）
* 役割: 「入力（リクエスト）」用
* 中身: データベースが自動で決める項目（読み取り専用＝readonly）を除外したものです。
* 用途: ユーザーから新規登録データを受け取る時に使います。

#### 1つしかなかったら
例えば、Player を登録するAPIを「無印モデル」だけで作ろうとすると、こうなります。

問題: APIが「新しいプレイヤーを登録するなら id も送ってください」と要求してしまいます。

現実: id はデータベースが自動で 1, 2, 3... と割り振るものなので、ユーザー（フロントエンド）側は何を送ればいいか分かりません。

ここで exclude_readonly=True を指定した In モデルを使うことで、**「id はこっちでやるから、それ以外の名前やメールだけ送ってね」**というスマートな窓口が作れるのです。

#### 例
```python
X_Pydantic = pydantic_model_creator(X, name="X")
X_PydanticIn = pydantic_mdoel_creator(X, name="XIn", exclude_readonly=True)
```