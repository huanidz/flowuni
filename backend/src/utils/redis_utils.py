from src.extensions.database import redis_client


def get_redis_client():
    return redis_client


def set_field_hset_by_thread_id(thread_id, key, value, ttl=180):
    hash_key = f"thread:{thread_id}"
    redis_client.hset(hash_key, key, value)
    redis_client.expire(hash_key, ttl)


def get_field_hget_by_thread_id(thread_id, key):
    hash_key = f"thread:{thread_id}"
    return redis_client.hget(hash_key, key)


def exists_field_hexists_by_thread_id(thread_id, key):
    hash_key = f"thread:{thread_id}"
    return redis_client.hexists(hash_key, key)


def delete_field_hdel_by_thread_id(thread_id, key):
    hash_key = f"thread:{thread_id}"
    redis_client.delete(hash_key, key)


def clear_hash_by_thread_id(thread_id):
    hash_key = f"thread:{thread_id}"
    redis_client.delete(hash_key)


def handle_unfinished_message(thread_id, text):
    """Handle unfinished messages stored in Redis."""
    with redis_client.pipeline() as pipe:
        hash_key = f"thread:{thread_id}"
        pipe.hexists(hash_key, "processing")
        pipe.hget(hash_key, "unfinished")
        exists, unfinished_message = pipe.execute()

    if exists:
        unfinished_message = unfinished_message.decode() if unfinished_message else ""
        merged_message = f"{unfinished_message}\n{text}" if unfinished_message else text
        set_field_hset_by_thread_id(thread_id, "unfinished", merged_message)
        set_field_hset_by_thread_id(thread_id, "interrupt", "true")
        return merged_message
    else:
        set_field_hset_by_thread_id(thread_id, "unfinished", text)
        return text
