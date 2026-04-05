from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import unquote


_TRUE_QUERY_VALUES = {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class DownloadJobsQuery:
    active_only: bool
    book_id: str = ""
    last_sig: str = ""

    @property
    def book_id_or_none(self) -> str | None:
        value = str(self.book_id or "").strip()
        return value or None


@dataclass(frozen=True)
class ExportJobsQuery:
    book_id: str = ""
    last_sig: str = ""

    @property
    def book_id_or_none(self) -> str | None:
        value = str(self.book_id or "").strip()
        return value or None


@dataclass(frozen=True)
class ExportDownloadRoute:
    name: str
    book_id: str = ""
    chapter_id: str = ""
    job_id: str = ""


def _query_first(query: dict[str, list[str]], key: str) -> str:
    values = query.get(key)
    if not isinstance(values, list) or not values:
        return ""
    return str(values[0] or "").strip()


def _decoded_query_value(query: dict[str, list[str]], key: str) -> str:
    return unquote(_query_first(query, key))


def _match_path_value(path: str, *, prefix: str, suffix: str = "") -> str | None:
    if not str(path or "").startswith(prefix):
        return None
    if suffix and not str(path or "").endswith(suffix):
        return None
    value = str(path or "")[len(prefix) :]
    if suffix:
        value = value[: -len(suffix)]
    return unquote(value).strip("/")


def parse_download_jobs_query(query: dict[str, list[str]]) -> DownloadJobsQuery:
    all_raw = _query_first(query, "all").lower()
    return DownloadJobsQuery(
        active_only=all_raw not in _TRUE_QUERY_VALUES,
        book_id=_decoded_query_value(query, "book_id"),
        last_sig=_query_first(query, "last_sig"),
    )


def parse_export_jobs_query(query: dict[str, list[str]]) -> ExportJobsQuery:
    return ExportJobsQuery(
        book_id=_decoded_query_value(query, "book_id"),
        last_sig=_query_first(query, "last_sig"),
    )


def match_export_download_route(method: str, path: str) -> ExportDownloadRoute | None:
    method_upper = str(method or "").strip().upper()
    raw_path = str(path or "")

    if method_upper == "GET":
        if raw_path == "/api/library/download/jobs/stream":
            return ExportDownloadRoute(name="download_jobs_stream")
        if raw_path == "/api/library/export/jobs/stream":
            return ExportDownloadRoute(name="export_jobs_stream")
        if raw_path == "/api/library/download/jobs":
            return ExportDownloadRoute(name="download_jobs")
        if raw_path == "/api/library/export/jobs":
            return ExportDownloadRoute(name="export_jobs")
        return None

    if method_upper == "POST":
        book_id = _match_path_value(raw_path, prefix="/api/library/book/", suffix="/download")
        if book_id is not None:
            return ExportDownloadRoute(name="book_download", book_id=book_id)

        book_id = _match_path_value(raw_path, prefix="/api/library/book/", suffix="/export")
        if book_id is not None:
            return ExportDownloadRoute(name="book_export", book_id=book_id)

        job_id = _match_path_value(raw_path, prefix="/api/library/download/", suffix="/stop")
        if job_id is not None:
            return ExportDownloadRoute(name="download_stop", job_id=job_id)

        chapter_id = _match_path_value(raw_path, prefix="/api/library/chapter/", suffix="/download")
        if chapter_id is not None:
            return ExportDownloadRoute(name="chapter_download", chapter_id=chapter_id)
        return None

    if method_upper == "DELETE":
        job_id = _match_path_value(raw_path, prefix="/api/library/export/")
        if job_id is not None:
            return ExportDownloadRoute(name="export_delete", job_id=job_id)
        return None

    return None
