from __future__ import annotations

from typing import Any


def serialize_job(job: dict[str, Any] | None) -> dict[str, Any]:
    data = dict(job or {})
    result = data.get("result") if isinstance(data.get("result"), dict) else None
    return {
        "ok": True,
        "job_id": str(data.get("job_id") or ""),
        "status": str(data.get("status") or "unknown"),
        "book_id": str(data.get("book_id") or ""),
        "chapter_id": str(data.get("chapter_id") or ""),
        "source_lang": str(data.get("source_lang") or ""),
        "target_lang": str(data.get("target_lang") or ""),
        "mode": str(data.get("mode") or "overlay"),
        "done_pages": int(data.get("done_pages") or 0),
        "total_pages": int(data.get("total_pages") or 0),
        "message": str(data.get("message") or ""),
        "error_code": str(data.get("error_code") or ""),
        "created_at": str(data.get("created_at") or ""),
        "started_at": str(data.get("started_at") or ""),
        "updated_at": str(data.get("updated_at") or ""),
        "finished_at": str(data.get("finished_at") or ""),
        "result": result,
    }
