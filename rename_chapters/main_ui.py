"""Entry point cho giao diện Tkinter cổ điển (single-instance, bootstrap nhanh)."""

import json
import multiprocessing
import os
import socket
import sys

from app.paths import BASE_DIR

_HOST = "127.0.0.1"
_DEFAULT_PORT = 45952
_CONFIG_PATH = os.path.join(BASE_DIR, "config.json")
_PORT = _DEFAULT_PORT
_SHOW_CMD = b"SHOW"
_SHOW_ACK = b"OK"


def _normalize_port(raw, default=_DEFAULT_PORT):
    try:
        port = int(raw)
    except Exception:
        return default
    if 1024 <= port <= 65535:
        return port
    return default


def _load_single_instance_port() -> int:
    env_raw = os.environ.get("RC_SINGLE_INSTANCE_PORT", "").strip()
    if env_raw:
        return _normalize_port(env_raw)
    try:
        if os.path.exists(_CONFIG_PATH):
            with open(_CONFIG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict):
                single_cfg = data.get("single_instance")
                if isinstance(single_cfg, dict):
                    return _normalize_port(single_cfg.get("port"))
    except Exception:
        pass
    return _DEFAULT_PORT


def _set_runtime_single_instance_port(port: int):
    global _PORT
    port = _normalize_port(port)
    _PORT = port
    os.environ["RC_SINGLE_INSTANCE_PORT"] = str(port)


def _notify_running_instance() -> bool:
    """Nếu instance đang chạy, gửi lệnh SHOW và trả True."""
    try:
        with socket.create_connection((_HOST, _PORT), timeout=0.6) as conn:
            conn.settimeout(0.8)
            conn.sendall(_SHOW_CMD)
            try:
                data = conn.recv(16)
            except Exception:
                data = b""
        return data.strip().upper() == _SHOW_ACK
    except Exception:
        return False


def main():
    _set_runtime_single_instance_port(_load_single_instance_port())
    # Kiểm tra nhanh trước khi import Tk (tránh tải nặng nếu đã có instance).
    if _notify_running_instance():
        try:
            sys.stderr.write("[main_ui] existing instance detected; SHOW sent\n")
            sys.stderr.flush()
        except Exception:
            pass
        return

    # Import phần UI sau khi chắc chắn chưa có instance đang chạy.
    from app.ui.tk_app import main as tk_main, ensure_single_instance_or_exit

    instance_server = ensure_single_instance_or_exit()
    tk_main(instance_server=instance_server)


if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
