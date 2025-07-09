class GenConfig:

    SHARED_MODEL = "gemini-2.5-flash"

    DEFAULTS = {
        "temperature": 0.5,
        "frequency_penalty": 0.05,
        "max_output_tokens": 6144,
        "top_p": 0.95,
        "top_k": 30,
    }

    HIGH_DETERMINISTIC = {
        "temperature": 0.1,
        "frequency_penalty": 0.05,
        "max_output_tokens": 6144,
        "top_p": 0.95,
        "top_k": 10,
    }

    HIGH_CREATIVE = {
        "temperature": 1,
        "frequency_penalty": 0.05,
        "max_output_tokens": 6144,
        "top_p": 0.95,
        "top_k": 50,
    }

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
