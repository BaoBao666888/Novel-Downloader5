import json
import os
from datetime import datetime
from typing import Any

from app.paths import BASE_DIR


TEXT_OPS_STATE_PATH = os.path.join(BASE_DIR, "local", "text_ops_state.json")
MAX_TEXT_OPS_HISTORY = 40
MAX_TEXT_OPS_RECENT = 12


def _now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _unique_values(values: list[Any], limit: int = MAX_TEXT_OPS_HISTORY) -> list[str]:
    result: list[str] = []
    for value in values or []:
        text = str(value or "").strip()
        if text and text not in result:
            result.append(text)
        if len(result) >= limit:
            break
    return result


class TextOpsStateStore:
    """State riêng cho cửa sổ Xử lý văn bản, tách khỏi config.json."""

    def __init__(self, path: str = TEXT_OPS_STATE_PATH):
        self.path = path
        self.state = self._default_state()
        self.load()

    def _default_state(self) -> dict[str, Any]:
        return {
            "version": 1,
            "recent_files": [],
            "history_files": [],
            "find_history": [],
            "replace_history": [],
            "split_regex_history": [],
            "split_format_history": ["part_{num}.txt"],
            "quick_regex_history": [r"第\d+章"],
            "pins": {
                "find": [],
                "replace": [],
                "split": [],
                "quick_regex": [],
            },
            "font": {
                "family": "Microsoft YaHei",
                "size": 11,
            },
            "migrated_from_config": False,
        }

    def load(self):
        if not os.path.exists(self.path):
            return
        try:
            with open(self.path, "r", encoding="utf-8") as handle:
                loaded = json.load(handle)
            if isinstance(loaded, dict):
                merged = self._default_state()
                merged.update(loaded)
                if not isinstance(merged.get("pins"), dict):
                    merged["pins"] = self._default_state()["pins"]
                if not isinstance(merged.get("font"), dict):
                    merged["font"] = self._default_state()["font"]
                self.state = merged
        except Exception:
            self.state = self._default_state()

    def save(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        tmp_path = f"{self.path}.tmp"
        with open(tmp_path, "w", encoding="utf-8") as handle:
            json.dump(self.state, handle, ensure_ascii=False, indent=2)
        os.replace(tmp_path, self.path)

    def migrate_from_config(self, config_data: dict[str, Any]):
        if self.state.get("migrated_from_config"):
            return
        config_data = config_data if isinstance(config_data, dict) else {}
        fr_history = config_data.get("find_replace_history")
        if isinstance(fr_history, dict):
            self.add_history_values("find_history", fr_history.get("find", []), save=False)
            self.add_history_values("replace_history", fr_history.get("replace", []), save=False)
        self.add_history_values("split_regex_history", config_data.get("split_regex_history", []), save=False)
        self.add_history_values("split_format_history", config_data.get("split_format_history", []), save=False)
        split_last = str(config_data.get("split_regex_last") or "").strip()
        if split_last:
            self.add_history_value("split_regex_history", split_last, save=False)
        selected_file = str(config_data.get("selected_file") or "").strip()
        if selected_file:
            self.record_file(selected_file, save=False)
        pins = config_data.get("regex_pins")
        if isinstance(pins, dict):
            store_pins = self.state.setdefault("pins", {})
            for key in ("find", "replace", "split"):
                store_pins[key] = _unique_values(list(pins.get(key, [])) + list(store_pins.get(key, [])))
        self.state["migrated_from_config"] = True
        self.save()

    def get_list(self, key: str) -> list[str]:
        return list(self.state.get(key) or [])

    def set_list(self, key: str, values: list[Any], *, save: bool = True):
        self.state[key] = _unique_values(values)
        if save:
            self.save()

    def add_history_value(self, key: str, value: str, *, save: bool = True):
        value = str(value or "").strip()
        if not value:
            return
        existing = [item for item in self.get_list(key) if item != value]
        self.state[key] = [value] + existing[: MAX_TEXT_OPS_HISTORY - 1]
        if save:
            self.save()

    def add_history_values(self, key: str, values: list[Any], *, save: bool = True):
        for value in reversed(list(values or [])):
            self.add_history_value(key, str(value or ""), save=False)
        if save:
            self.save()

    def get_pins(self, key: str) -> list[str]:
        pins = self.state.setdefault("pins", {})
        values = pins.get(key, []) if isinstance(pins, dict) else []
        return _unique_values(values)

    def toggle_pin(self, key: str, value: str):
        value = str(value or "").strip()
        if not value:
            return
        pins = self.state.setdefault("pins", {})
        current = [item for item in self.get_pins(key) if item != value]
        if value not in self.get_pins(key):
            current.insert(0, value)
        pins[key] = current[:MAX_TEXT_OPS_HISTORY]
        self.save()

    def history_with_pins(self, history_key: str, pin_key: str) -> list[str]:
        pins = self.get_pins(pin_key)
        history = self.get_list(history_key)
        return _unique_values(pins + history)

    def record_file(self, path: str, *, save: bool = True):
        path = os.path.normpath(str(path or "").strip())
        if not path:
            return
        now = _now_iso()
        recent = [item for item in self.get_list("recent_files") if os.path.normcase(item) != os.path.normcase(path)]
        self.state["recent_files"] = [path] + recent[: MAX_TEXT_OPS_RECENT - 1]

        history = []
        found = False
        for entry in self.state.get("history_files") or []:
            if not isinstance(entry, dict):
                continue
            entry_path = os.path.normpath(str(entry.get("path") or ""))
            if os.path.normcase(entry_path) == os.path.normcase(path):
                entry = dict(entry)
                entry["path"] = path
                entry["last_opened_at"] = now
                entry["open_count"] = int(entry.get("open_count") or 0) + 1
                found = True
            history.append(entry)
        if not found:
            history.append({"path": path, "first_opened_at": now, "last_opened_at": now, "open_count": 1})
        history.sort(key=lambda item: str(item.get("last_opened_at") or ""), reverse=True)
        self.state["history_files"] = history[:500]
        if save:
            self.save()

    def remove_files(self, paths: list[str]):
        remove_set = {os.path.normcase(os.path.normpath(str(path or ""))) for path in paths}
        self.state["recent_files"] = [
            path for path in self.get_list("recent_files")
            if os.path.normcase(os.path.normpath(path)) not in remove_set
        ]
        self.state["history_files"] = [
            entry for entry in (self.state.get("history_files") or [])
            if isinstance(entry, dict)
            and os.path.normcase(os.path.normpath(str(entry.get("path") or ""))) not in remove_set
        ]
        self.save()

    def get_font(self) -> tuple[str, int]:
        font = self.state.get("font") if isinstance(self.state.get("font"), dict) else {}
        family = str(font.get("family") or "Microsoft YaHei")
        try:
            size = int(font.get("size") or 11)
        except Exception:
            size = 11
        return family, max(8, min(36, size))

    def set_font(self, family: str, size: int):
        self.state["font"] = {"family": family or "Microsoft YaHei", "size": max(8, min(36, int(size or 11)))}
        self.save()
