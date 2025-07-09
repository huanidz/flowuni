from langfuse import Langfuse
import time
from functools import wraps


# Lazy initialization of the Langfuse client to allow imports in other modules
def get_langfuse():
    if not hasattr(get_langfuse, "langfuse"):
        get_langfuse.langfuse = Langfuse(debug=False)

    return get_langfuse.langfuse


def timeit(key: str):
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            start_time = time.perf_counter()
            result = func(self, *args, **kwargs)
            elapsed_time = time.perf_counter() - start_time
            # Store the timing result in the TimingResults dictionary
            self.timing_results[key] = elapsed_time
            return result

        return wrapper

    return decorator
