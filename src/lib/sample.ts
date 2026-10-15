export const SAMPLE_CODE = `import time
from collections import OrderedDict
from typing import Generic, Hashable, Optional, TypeVar

K = TypeVar("K", bound=Hashable)
V = TypeVar("V")


class TTLCache(Generic[K, V]):
    def __init__(self, capacity: int = 128, ttl_seconds: float = 60.0):
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        self.capacity = capacity
        self.ttl = ttl_seconds
        self._data: "OrderedDict[K, tuple[float, V]]" = OrderedDict()
        self.hits = 0
        self.misses = 0

    def get(self, key: K, default: Optional[V] = None) -> Optional[V]:
        item = self._data.get(key)
        if item is None:
            self.misses += 1
            return default
        expires_at, value = item
        if expires_at < time.monotonic():
            del self._data[key]
            self.misses += 1
            return default
        self._data.move_to_end(key)
        self.hits += 1
        return value

    def set(self, key: K, value: V, ttl: Optional[float] = None) -> None:
        expires_at = time.monotonic() + (self.ttl if ttl is None else ttl)
        self._data[key] = (expires_at, value)
        self._data.move_to_end(key)
        while len(self._data) > self.capacity:
            self._data.popitem(last=False)

    def purge_expired(self) -> int:
        now = time.monotonic()
        stale = [k for k, (exp, _) in self._data.items() if exp < now]
        for k in stale:
            del self._data[k]
        return len(stale)

    @property
    def hit_rate(self) -> float:
        total = self.hits + self.misses
        return self.hits / total if total else 0.0
`;
