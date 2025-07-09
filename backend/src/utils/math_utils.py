import numpy as np
from numpy import dot
from numpy.linalg import norm
from typing import List


def cosine_similarity(list_1: List[float], list_2: List[float]) -> float:
    cos_sim = dot(list_1, list_2) / (norm(list_1) * norm(list_2))
    cos_sim = cos_sim.astype(np.float32).tolist()
    return cos_sim


def inner_product(list_1: List[float], list_2: List[float]) -> float:
    return np.inner(list_1, list_2).astype(np.float32).tolist()


def sigmoid(x: float) -> float:
    result = 1 / (1 + np.exp(-x))
    result = result.astype(np.float32).tolist()
    return result
