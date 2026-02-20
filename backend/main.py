from fastapi import FastAPI, HTTPException
from tortoise.contrib.fastapi import register_tortoise
from typing import List

# models.pyからモデルやPydanticモデルをインポート
from models import Player, Player_Pydantic, Player_PydanticIn, Session, Session_Pydantic, Session_PydanticIn, Interval, Interval_Pydantic, Interval_PydanticIn

# 環境変数の利用
import os
from dotenv import load_dotenv

load_dotenv(".env.back")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite://db.sqlite3") # なければSQLite

# FastAPIのインスタンスを作成
app = FastAPI()

# --- CORS設定の追加 ---
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000", # React(標準)
    "http://localhost:5173", # Vite(最近の主流)
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # 許可するオリジンのリスト
    allow_credentials=True,     # クッキーや認証情報の共有を許すか
    allow_methods=["*"],        # すべてのメソッド（GET, POST, DELETE等）を許可
    allow_headers=["*"],        # すべてのヘッダーを許可
)

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

# PlayerのDELETE
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


# Session POST
@app.post("/player/{player_id}/session", response_model=Session_Pydantic)
async def create_session(player_id: int, session_info: Session_PydanticIn):
    # 1. プレイヤーが実在するか確認（いなければ404エラーになる）
    player = await Player.get(id=player_id)
    
    # 2. セッションを作成（player_id を直接指定して紐付け）
    session_obj = await Session.create(
        **session_info.dict(exclude_unset=True), 
        player=player
    )
    
    return await Session_Pydantic.from_tortoise_orm(session_obj)

# Session GET
@app.get("/sessions", response_model=List[Session_Pydantic])
async def get_sessions():
    return await Session_Pydantic.from_queryset(Session.all())

# Session DELETE
@app.delete("/session/{session_id}")
async def delete_session(session_id: int):
    deleted_count = await Session.filter(id=session_id).delete()
    
    if not deleted_count:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    return {"status": "ok", "message": f"Deleted session {session_id}"}

# Session PUT
@app.put("/session/{session_id}")
async def update_session(session_id: int, update_info: Session_PydanticIn):
    session = await Session.get(id=session_id)
    update_data = update_info.dict(exclude_unset=True)

    session.update_from_dict(update_data)

    await session.save()
    return await Session_Pydantic.from_tortoise_orm(session)

# Interval POST
@app.post("/session/{session_id}/interval", response_model=Interval_Pydantic)
async def create_interval(session_id: int, interval_info: Interval_PydanticIn):
    session = await Session.get(id=session_id)

    interval_obj = await Interval.create(
        **interval_info.dict(exclude_unset=True),
        session=session
    )

    return await Interval_Pydantic.from_tortoise_orm(interval_obj)

# Interval GET
@app.get("/intervals", response_model=List[Interval_Pydantic])
async def get_intervals():
    return await Interval_Pydantic.from_queryset(Interval.all())

# Interval DELETE
@app.delete("/interval/{interval_id}")
async def delete_interval(interval_id: int):
    deleted_count = await Interval.filter(id=interval_id).delete()
    
    if not deleted_count:
        raise HTTPException(status_code=404, detail=f"Interval {interval_id} not found")
    
    return {"status": "ok", "message": f"Deleted interval {interval_id}"}


# Tortoise ORMの紐付け設定
register_tortoise(
    app,
    db_url=DATABASE_URL,          # データベースファイルの保存先と名前
    modules={"models": ["models"]},         # モデルが定義されているファイル名
    generate_schemas=True,                 # 起動時にテーブルがなければ自動作成する
    add_exception_handlers=True,           # データベース関連のエラーを分かりやすく表示する
)