from fastapi import FastAPI
from tortoise.contrib.fastapi import register_tortoise
from typing import List

# models.pyからモデルやPydanticモデルをインポート
from models import Player, Player_Pydantic, Player_PydanticIn, Session, Session_Pydantic, Session_PydanticIn, SessionInterval, Interval_Pydantic, Interval_PydanticIn

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
@app.post("/player", response_model=Player_Pydantic)
async def create_player(player: Player_PydanticIn):
    player_obj = await Player.create(**player.dict(exclude_unset=True))
    return await Player_Pydantic.from_tortoise_orm(player_obj)
    
# PlayerのGET
@app.get("/players", response_model=List[Player_Pydantic])
async def get_players():
    # Player.all() で全データを取得し、Pydanticモデルのリストに変換
    return await Player_Pydantic.from_queryset(Player.all())

# Tortoise ORMの紐付け設定
register_tortoise(
    app,
    db_url=DATABASE_URL,          # データベースファイルの保存先と名前
    modules={"models": ["models"]},         # モデルが定義されているファイル名
    generate_schemas=True,                 # 起動時にテーブルがなければ自動作成する
    add_exception_handlers=True,           # データベース関連のエラーを分かりやすく表示する
)