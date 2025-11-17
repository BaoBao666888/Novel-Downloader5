"""Entry point cho giao diện Tkinter cổ điển."""

import multiprocessing

from app.ui.tk_app import main as tk_main


def main():
    tk_main()


if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
