from fastapi import FastAPI

app = FastAPI(title="Event Service")

# Kết nối tới Redis, lấy URL từ biến môi trường
# REDIS_URL = os.getenv("REDIS_URL", "redis://redis-service:6379")


# Đây là phần quan trọng: Xác thực người dùng.
# Trong microservice, cách phổ biến là truyền một JWT token qua query param hoặc header
# và service sẽ tự giải mã nó.
# async def get_user_id_from_token(token: str = Query(...)):
#     if not token:
#         raise HTTPException(status_code=401, detail="Not authenticated")
#     # --- LOGIC GIẢI MÃ JWT TOKEN ĐỂ LẤY user_id NÊN ĐƯỢC ĐẶT Ở ĐÂY ---
#     # Ví dụ đơn giản:
#     try:
#         # Giả sử token chỉ đơn giản là "user:<id>"
#         if token.startswith("user:"):
#             return token.split(":")[1]
#         else:
#             raise ValueError("Invalid token format")
#     except Exception:
#         raise HTTPException(status_code=401, detail="Invalid token")


# @app.get("/events/me")
# async def stream_user_events(
#     request: Request, user_id: str = Depends(get_user_id_from_token)
# ):
#     """
#     Mở một kết nối SSE duy nhất cho user để nhận tất cả các event.
#     """

#     async def event_generator():
#         r = await redis.from_url(REDIS_URL, decode_responses=True)
#         pubsub = r.pubsub()
#         channel = f"user_events:{user_id}"
#         await pubsub.subscribe(channel)

#         try:
#             while True:
#                 if await request.is_disconnected():
#                     break

#                 message = await pubsub.get_message(
#                     ignore_subscribe_messages=True, timeout=15
#                 )
#                 if message:
#                     # Dữ liệu từ Celery worker sẽ chứa cả task_id và payload
#                     # FE sẽ dựa vào task_id trong data để cập nhật đúng item.
#                     # message['data'] là một chuỗi JSON được publish từ Celery worker.
#                     yield f"data: {message['data']}\n\n"

#                 await asyncio.sleep(0.01)
#         finally:
#             await pubsub.unsubscribe(channel)
#             await r.close()

#     return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
