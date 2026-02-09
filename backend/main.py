from fastapi import FastAPI
from tortoise.contrib.fastapi import register_tortoise

# models.pyからモデルやPydanticモデルをインポート
from models import Player_Pydantic, Player_PydanticIn, Session_Pydantic, Session_PydanticIn, Interval_Pydantic, Interval_PydanticIn

# 環境変数の利用
import os
from dotenv import load_dotenv

load_dotenv(".env.back")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite://db.sqlite3") # なければSQLite

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

# PlayerのPOST
@app.post("/player", respnse_model=Player_Pydantic)
aync def create_player(player: Player_PydanticIn):
    player_obj = await Player.create(**player.dict(exclude_unset=True))
    response = await Player_Pydantic.from_tortoise_orm(player_obj)
    return {"status": "ok", "data": response}

# Tortoise ORMの紐付け設定
register_tortoise(
    app,
    db_url=DATABASE_URL,          # データベースファイルの保存先と名前
    modules={"models": ["models"]},         # モデルが定義されているファイル名
    generate_schemas=True,                 # 起動時にテーブルがなければ自動作成する
    add_exception_handlers=True,           # データベース関連のエラーを分かりやすく表示する
)