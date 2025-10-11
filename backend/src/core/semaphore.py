import redis
from src.configs.config import get_app_settings

app_settings = get_app_settings()

REDIS_HOST = app_settings.REDIS_HOST
REDIS_PORT = app_settings.REDIS_PORT
REDIS_DB = app_settings.REDIS_DB

REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

USER_LIMIT = (
    app_settings.LIMIT_TEST_CASE_PER_USER
)  # Mỗi user tối đa 3 slot chạy đồng thời
SEMAPHORE_TTL = (
    app_settings.LIMIT_TTL_TEST_CASE_SEMAPHORE_PER_USER_SECONDS
)  # 1 giờ, phòng trường hợp task chết đột ngột

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# ==========================
# Lua script (semaphore)
# ==========================
LUA_ACQUIRE = """
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

local current_val = redis.call('INCR', key)
if tonumber(current_val) > limit then
  redis.call('DECR', key)
  return 0
else
  -- Set TTL để tránh deadlock nếu worker chết
  redis.call('EXPIRE', key, ttl)
  return 1
end
"""

LUA_RELEASE = """
local key = KEYS[1]
local current_val = redis.call('DECR', key)
-- Nếu giảm xuống dưới 0 (hiếm khi xảy ra), reset về 0
if tonumber(current_val) < 0 then
    redis.call('SET', key, 0)
end
return 1
"""

# Đăng ký script với Redis để tối ưu hoá
# Redis sẽ cache script và trả về SHA hash, lần sau chỉ cần gọi bằng SHA
acquire_script = redis_client.register_script(LUA_ACQUIRE)
release_script = redis_client.register_script(LUA_RELEASE)


### === Asynchronous version ===
# async def acquire_user_slot(user_id: int) -> bool:
#     """Cố gắng chiếm một slot cho user."""
#     key = f"semaphore:user:{user_id}"
#     result = await acquire_script(keys=[key], args=[USER_LIMIT, SEMAPHORE_TTL])
#     return result == 1


# async def release_user_slot(user_id: int):
#     """Giải phóng một slot của user."""
#     key = f"semaphore:user:{user_id}"
#     await release_script(keys=[key])


def acquire_user_slot_sync(user_id: int) -> bool:
    """Synchronous version of acquire_user_slot."""
    key = f"semaphore:user:{user_id}"
    # Use sync Redis client with the same Lua script
    result = redis_client.eval(LUA_ACQUIRE, 1, key, USER_LIMIT, SEMAPHORE_TTL)
    return result == 1


def release_user_slot_sync(user_id: int):
    """Synchronous version of release_user_slot."""
    key = f"semaphore:user:{user_id}"
    redis_client.eval(LUA_RELEASE, 1, key)
