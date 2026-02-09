from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator

class Player(models.Model):
    id = fields.IntField(pk=True)
    player_name = fields.CharField(max_length=50, description="プレイヤー名")
    email = fields.CharField(max_length=255, unique=True, description="メールアドレス")

    class Meta:
        table = "players"

class Session(models.Model):
    id = fields.IntField(pk=True)
    player = fields.ForeignKeyField('models.Player', related_name='sessions', on_delete=fields.CASCADE)
    date = fields.DateField(description="日付")
    location = fields.CharField(max_length=255, description="場所")
    game_type = fields.CharField(max_length=50, description="ゲーム")
    memo = fields.TextField(null=True)

    class Meta:
        table = "sessions"

class SessionInterval(models.Model):
    id = fields.IntField(pk=True)
    session = fields.ForeignKeyField('models.Session', related_name='intervals', on_delete=fields.CASCADE)
    timestamp = fields.DatetimeField(description="記録時刻")
    stack = fields.IntField(description="スタック")
    add_on_amount = fields.IntField(default=0, description="バイイン")

    class Meta:
        table = "session_intervals"