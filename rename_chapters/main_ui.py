"""Entry point cho giao diện Tkinter cổ điển (single-instance, bootstrap nhanh)."""

import multiprocessing
import os
import socket
import sys

_HOST = "127.0.0.1"
_PORT = int(os.environ.get("RC_SINGLE_INSTANCE_PORT", "45952"))


def _notify_running_instance() -> bool:
    """Nếu instance đang chạy, gửi lệnh SHOW và trả True."""
    try:
        with socket.create_connection((_HOST, _PORT), timeout=0.6) as conn:
            conn.sendall(b"SHOW")
        return True
    except Exception:
        return False


def main():
    # Kiểm tra nhanh trước khi import Tk (tránh tải nặng nếu đã có instance).
    if _notify_running_instance():
        return

    # Import phần UI sau khi chắc chắn chưa có instance đang chạy.
    from app.ui.tk_app import main as tk_main, ensure_single_instance_or_exit

    instance_server = ensure_single_instance_or_exit()
    tk_main(instance_server=instance_server)


if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
