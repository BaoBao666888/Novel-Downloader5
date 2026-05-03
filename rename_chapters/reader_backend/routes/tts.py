from __future__ import annotations

from typing import Any


def handle_api(
    handler,
    method: str,
    path: str,
    query: dict[str, list[str]],
    *,
    api_error_cls,
    http_status,
) -> dict[str, Any] | None:
    api_error = api_error_cls

    if method == "GET" and path == "/api/tts/plugins":
        items = handler.service.list_tts_plugins()
        return {"ok": True, "items": items, "count": len(items)}

    if method == "POST" and path == "/api/tts/voices":
        payload = handler._read_json_body()
        plugin_id = str(payload.get("plugin_id") or "").strip()
        if not plugin_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id.")
        return handler.service.get_tts_plugin_voices(plugin_id)

    if method == "POST" and path == "/api/tts/synthesize":
        payload = handler._read_json_body()
        plugin_id = str(payload.get("plugin_id") or "").strip()
        if not plugin_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id.")
        return handler.service.synthesize_tts_audio(
            plugin_id=plugin_id,
            text=str(payload.get("text") or ""),
            voice_id=str(payload.get("voice_id") or ""),
        )

    return None
