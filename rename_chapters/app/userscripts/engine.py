"""Simple Tampermonkey-like host for the embedded Qt browser."""
from __future__ import annotations

import base64
import json
import os
import re
import threading
import weakref
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
import uuid
from typing import Dict, List, Optional, Tuple

import requests
from requests import RequestException, Timeout
from PyQt6.QtCore import QObject, pyqtSlot, pyqtSignal, Qt
from PyQt6.QtWebChannel import QWebChannel

from app.paths import BASE_DIR


META_BLOCK_RE = re.compile(r"// ==UserScript==(?P<body>.*?)// ==/UserScript==", re.DOTALL)
HTTP_PREFIX_RE = re.compile(r"^https?://", re.IGNORECASE)


class UiDispatcher(QObject):
    """Helper to safely execute callables on the UI thread."""

    run_signal = pyqtSignal(object)

    def __init__(self):
        super().__init__()
        self.run_signal.connect(self._run, Qt.ConnectionType.QueuedConnection)  # type: ignore[attr-defined]

    def _run(self, fn):
        try:
            fn()
        except Exception as exc:  # pragma: no cover - defensive logging
            print(f"[UserscriptHost] ui dispatch error: {exc}")

    def submit(self, fn):
        self.run_signal.emit(fn)


def _read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as handle:
        return handle.read()


def _fetch_resource(path_or_url: str) -> str:
    if HTTP_PREFIX_RE.match(path_or_url):
        response = requests.get(path_or_url, timeout=45)
        response.raise_for_status()
        return response.text
    resolved = path_or_url
    if not os.path.isabs(resolved):
        resolved = os.path.join(BASE_DIR, path_or_url)
    return _read_text(resolved)


def _b64_encode(text: str) -> str:
    return base64.b64encode(text.encode("utf-8")).decode("ascii")


def _safe_json_dumps(data) -> str:
    return json.dumps(data, ensure_ascii=False)


@dataclass
class UserscriptMetadata:
    name: str = "Userscript"
    version: str = "0.0.0"
    description: str = ""
    namespace: str = ""
    author: str = ""
    include: List[str] = field(default_factory=list)
    match: List[str] = field(default_factory=list)
    grant: List[str] = field(default_factory=list)
    run_at: str = "document-end"
    resource_map: Dict[str, str] = field(default_factory=dict)
    require_urls: List[str] = field(default_factory=list)
    raw_meta_block: str = ""


def _parse_metadata(source: str) -> UserscriptMetadata:
    match = META_BLOCK_RE.search(source)
    metadata = UserscriptMetadata()
    if not match:
        return metadata
    body = match.group("body")
    metadata.raw_meta_block = body
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped.startswith("// @"):
            continue
        stripped = stripped[3:]
        if not stripped:
            continue
        parts = stripped.split(None, 1)
        if not parts:
            continue
        raw_key = parts[0].strip()
        if raw_key.startswith("@"):
            raw_key = raw_key[1:]
        key = raw_key.lower()
        value = parts[1].strip() if len(parts) > 1 else ""
        if key == "name":
            metadata.name = value
        elif key == "version":
            metadata.version = value
        elif key == "description":
            metadata.description = value
        elif key == "namespace":
            metadata.namespace = value
        elif key == "author":
            metadata.author = value
        elif key == "include":
            metadata.include.append(value)
        elif key == "match":
            metadata.match.append(value)
        elif key == "grant":
            metadata.grant.append(value)
        elif key == "run-at":
            metadata.run_at = value
        elif key == "resource":
            parts = value.split(None, 1)
            if len(parts) == 2:
                metadata.resource_map[parts[0]] = parts[1]
        elif key == "require":
            metadata.require_urls.append(value)
    if not metadata.include and not metadata.match:
        metadata.include.append("*")
    return metadata


@dataclass
class UserscriptEntry:
    id: str
    path: str
    enabled: bool = True
    download_url: str = ""
    name: str = ""
    includes: List[str] = field(default_factory=list)
    matches: List[str] = field(default_factory=list)
    last_error: Optional[str] = None

    def to_dict(self) -> Dict[str, object]:
        return {
            "id": self.id,
            "path": self.path,
            "enabled": self.enabled,
            "download_url": self.download_url,
            "name": self.name,
            "includes": self.includes,
            "matches": self.matches,
            "last_error": self.last_error,
        }


class UserscriptRegistry:
    """Lưu danh sách userscript, hỗ trợ bật/tắt và metadata."""

    def __init__(self, registry_path: str, default_script_path: Optional[str] = None):
        self.path = registry_path
        self.default_script_path = default_script_path
        self.entries: List[UserscriptEntry] = []
        self._load()

    def _load(self):
        if os.path.exists(self.path):
            try:
                with open(self.path, "r", encoding="utf-8") as handle:
                    raw = json.load(handle)
                for item in raw.get("scripts", []):
                    entry = UserscriptEntry(
                        id=item.get("id") or uuid.uuid4().hex,
                        path=item.get("path") or "",
                        enabled=bool(item.get("enabled", True)),
                        download_url=item.get("download_url") or "",
                        name=item.get("name") or "",
                        includes=item.get("includes") or [],
                        matches=item.get("matches") or [],
                        last_error=item.get("last_error"),
                    )
                    if entry.path:
                        self.entries.append(entry)
            except Exception:
                self.entries = []
        if not self.entries and self.default_script_path and os.path.exists(self.default_script_path):
            self.add_entry(self.default_script_path, save=False)
        self._save()

    def _save(self):
        data = {
            "scripts": [entry.to_dict() for entry in self.entries]
        }
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        with open(self.path, "w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False, indent=2)

    def save(self):
        self._save()

    def add_entry(self, path: str, download_url: str = "", enabled: bool = True, save: bool = True) -> UserscriptEntry:
        entry = UserscriptEntry(
            id=uuid.uuid4().hex,
            path=os.path.abspath(path),
            enabled=enabled,
            download_url=download_url or "",
        )
        self.entries.append(entry)
        if save:
            self._save()
        return entry

    def remove_entry(self, entry_id: str):
        self.entries = [entry for entry in self.entries if entry.id != entry_id]
        self._save()

    def get_entry(self, entry_id: str) -> Optional[UserscriptEntry]:
        for entry in self.entries:
            if entry.id == entry_id:
                return entry
        return None

    def set_enabled(self, entry_id: str, enabled: bool):
        entry = self.get_entry(entry_id)
        if entry:
            entry.enabled = enabled
            self._save()

    def set_download_url(self, entry_id: str, url: str):
        entry = self.get_entry(entry_id)
        if entry:
            entry.download_url = url or ""
            self._save()

    def update_metadata(self, entry_id: str, metadata: UserscriptMetadata):
        entry = self.get_entry(entry_id)
        if entry:
            entry.name = metadata.name or os.path.basename(entry.path)
            entry.includes = metadata.include[:]
            entry.matches = metadata.match[:]
            entry.last_error = None
            self._save()

    def record_error(self, entry_id: str, error: str):
        entry = self.get_entry(entry_id)
        if entry:
            entry.last_error = error
            self._save()

    def to_list(self) -> List[Dict[str, object]]:
        return [entry.to_dict() for entry in self.entries]


@dataclass
class Userscript:
    source_path: str
    code: str
    metadata: UserscriptMetadata
    requires: List[Dict[str, str]] = field(default_factory=list)
    resources: Dict[str, str] = field(default_factory=dict)

    @classmethod
    def load(cls, path: str) -> "Userscript":
        code = _read_text(path)
        metadata = _parse_metadata(code)
        requires: List[Dict[str, str]] = []
        for url in metadata.require_urls:
            try:
                requires.append({"url": url, "code": _fetch_resource(url)})
            except Exception as exc:  # pragma: no cover - defensive
                print(f"[UserscriptHost] Không thể tải @require {url}: {exc}")
        resources: Dict[str, str] = {}
        for name, url in metadata.resource_map.items():
            try:
                resources[name] = _fetch_resource(url)
            except Exception as exc:  # pragma: no cover - defensive
                print(f"[UserscriptHost] Không thể tải @resource {name}: {exc}")
        return cls(path, code, metadata, requires, resources)

    def matches(self, url: str) -> bool:
        if not url:
            return False
        patterns = self.metadata.include + self.metadata.match
        if not patterns:
            return True
        for pattern in patterns:
            regex = (
                pattern.replace(".", r"\.")
                .replace("*", ".*")
                .replace("?", ".")
            )
            regex = "^" + regex + "$"
            try:
                if re.match(regex, url, re.IGNORECASE):
                    return True
            except re.error:
                continue
        return False

    def bootstrap_payload(self) -> Dict[str, object]:
        return {
            "meta": {
                "name": self.metadata.name,
                "version": self.metadata.version,
                "description": self.metadata.description,
                "namespace": self.metadata.namespace,
                "author": self.metadata.author,
                "matches": self.metadata.match,
                "includes": self.metadata.include,
                "runAt": self.metadata.run_at,
                "metaStr": f"// ==UserScript==\n{self.metadata.raw_meta_block}// ==/UserScript==",
            },
            "script": _b64_encode(self.code),
            "requires": [
                {"url": entry["url"], "code": _b64_encode(entry["code"])}
                for entry in self.requires
            ],
            "resources": {
                key: _b64_encode(value)
                for key, value in self.resources.items()
            },
        }


class UserscriptStorage:
    def __init__(self, path: str):
        self.path = path
        self._lock = threading.Lock()
        self._data = self._load()

    def _load(self) -> Dict[str, object]:
        if not os.path.exists(self.path):
            return {}
        try:
            with open(self.path, "r", encoding="utf-8") as handle:
                data = json.load(handle)
            if isinstance(data, dict):
                return data
        except Exception:  # pragma: no cover - defensive
            pass
        return {}

    def snapshot(self, script_id: str) -> Dict[str, object]:
        with self._lock:
            return json.loads(json.dumps(self._data.get(script_id, {}), ensure_ascii=False))

    def set_value(self, script_id: str, key: str, value):
        with self._lock:
            script_store = self._data.setdefault(script_id, {})
            old_value = script_store.get(key)
            script_store[key] = value
            self._save_locked()
            return old_value

    def _save_locked(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        with open(self.path, "w", encoding="utf-8") as handle:
            json.dump(self._data, handle, ensure_ascii=False, indent=2)


class TampermonkeyBridge(QObject):
    """Qt WebChannel bridge used by injected scripts."""

    def __init__(self, controller: "UserscriptController"):
        super().__init__()
        self.controller = controller

    @pyqtSlot(str, str, str, name="gmSetValue")
    def gm_set_value(self, script_id: str, key: str, value_json: str):
        try:
            value = json.loads(value_json)
        except json.JSONDecodeError:
            value = value_json
        self.controller.host.handle_set_value(script_id, self.controller, key, value)

    @pyqtSlot(str, str, str, name="gmRegisterMenuCommand")
    def gm_register_menu_command(self, script_id: str, command_id: str, title: str):
        self.controller.register_menu_command(script_id, command_id, title)

    @pyqtSlot(str, str, name="gmUnregisterMenuCommand")
    def gm_unregister_menu_command(self, script_id: str, command_id: str):
        self.controller.unregister_menu_command(script_id, command_id)

    @pyqtSlot(str, str, bool, bool, name="gmOpenInTab")
    def gm_open_in_tab(self, script_id: str, url: str, active: bool, insert: bool):
        self.controller.host.open_tab(url, active, insert)

    @pyqtSlot(str, str, str, name="gmXmlHttpRequest")
    def gm_xml_http_request(self, script_id: str, request_id: str, options_json: str):
        try:
            options = json.loads(options_json)
        except json.JSONDecodeError:
            options = {}
        self.controller.host.submit_request(self.controller, script_id, request_id, options)

    @pyqtSlot(str, str, name="gmAbortXmlHttpRequest")
    def gm_abort_xml_http_request(self, script_id: str, request_id: str):
        self.controller.abort_request(script_id, request_id)


class UserscriptController:
    def __init__(self, host: "UserscriptHost", view):
        self.host = host
        self.view = view
        self.page = view.page()
        self.channel = QWebChannel(self.page)
        self.bridge = TampermonkeyBridge(self)
        self.channel.registerObject("TampermonkeyBridge", self.bridge)
        self.page.setWebChannel(self.channel)
        self.script_states: Dict[str, Dict[str, object]] = {}
        self.view.loadFinished.connect(self._on_load_finished)
        self.view.destroyed.connect(self._on_destroyed)

    def _clear_states(self):
        for state in self.script_states.values():
            for future in list(state.get("pending_requests", {}).values()):
                try:
                    future.cancel()
                except Exception:
                    pass
        self.script_states.clear()

    def _on_destroyed(self):
        self._clear_states()

    def _on_load_finished(self, ok: bool):
        self._clear_states()
        if not ok:
            return
        url = self.view.url().toString()
        matches = self.host.get_scripts_for_url(url)
        for entry, script in matches:
            store = self.host.storage.snapshot(entry.id)
            injection = self.host.build_bootstrap_script(script, entry.id, store, self.host.environment)
            if not injection:
                continue
            self.script_states[entry.id] = {
                "entry": entry,
                "menus": {},
                "pending_requests": {},
                "aborted": set(),
            }
            try:
                self.page.runJavaScript(injection)
            except Exception as exc:
                print(f"[UserscriptHost] Lỗi khi inject script {entry.path}: {exc}")

    def register_menu_command(self, script_id: str, command_id: str, title: str):
        state = self.script_states.get(script_id)
        if not state:
            return
        state["menus"][command_id] = title or "Menu"

    def unregister_menu_command(self, script_id: str, command_id: str):
        state = self.script_states.get(script_id)
        if not state:
            return
        state["menus"].pop(command_id, None)

    def list_menu_commands(self):
        commands = []
        for script_id, state in self.script_states.items():
            entry = state.get("entry")
            for cid, title in state.get("menus", {}).items():
                commands.append({
                    "script_id": script_id,
                    "script_name": entry.name if entry else "Script",
                    "id": cid,
                    "title": title
                })
        return commands

    def execute_menu_command(self, script_id: str, command_id: str):
        script = (
            "window.__tm_executeMenuCommand && "
            f"window.__tm_executeMenuCommand({json.dumps(script_id)}, {json.dumps(command_id)});"
        )
        self.page.runJavaScript(script)

    def dispatch_value_change(self, script_id: str, key: str, old_value, new_value):
        command = (
            "window.__tm_receiveRemoteValueChange && "
            f"window.__tm_receiveRemoteValueChange({json.dumps(script_id)}, "
            f"{json.dumps(key)}, {_safe_json_dumps(old_value)}, {_safe_json_dumps(new_value)});"
        )
        self.page.runJavaScript(command)

    def track_request_future(self, script_id: str, request_id: str, future):
        state = self.script_states.get(script_id)
        if not state:
            return
        state["pending_requests"][request_id] = future

    def abort_request(self, script_id: str, request_id: str):
        state = self.script_states.get(script_id)
        if not state:
            return
        future = state["pending_requests"].pop(request_id, None)
        state["aborted"].add(request_id)
        if future:
            try:
                future.cancel()
            except Exception:
                pass
        self._emit_request_result(script_id, request_id, False, {"status": 0, "statusText": "aborted", "responseText": ""})

    def dispatch_request_result(self, script_id: str, request_id: str, success: bool, payload: Dict[str, object]):
        state = self.script_states.get(script_id)
        if not state:
            return
        state["pending_requests"].pop(request_id, None)
        if request_id in state["aborted"]:
            state["aborted"].discard(request_id)
            return
        self._emit_request_result(script_id, request_id, success, payload)

    def _emit_request_result(self, script_id: str, request_id: str, success: bool, payload: Dict[str, object]):
        script = (
            "window.__tm_handleXhrResponse && "
            f"window.__tm_handleXhrResponse({json.dumps(script_id)}, {json.dumps(request_id)}, "
            f"{_safe_json_dumps({'success': success, **payload})});"
        )
        self.page.runJavaScript(script)


class UserscriptHost:
    def __init__(self, window, registry_path: str, storage_path: str, default_script_path: Optional[str] = None):
        self.window = window
        self.registry = UserscriptRegistry(registry_path, default_script_path)
        self.storage = UserscriptStorage(storage_path)
        self._ui_dispatcher = UiDispatcher()
        self.environment = {
            "handlerName": "RenameChaptersTamperHost",
            "handlerVersion": "0.1.0",
            "platform": {
                "browserName": "QtWebEngine",
                "browserVersion": "",
            }
        }
        self._controllers: "weakref.WeakKeyDictionary[object, UserscriptController]" = weakref.WeakKeyDictionary()
        self._thread_pool = ThreadPoolExecutor(max_workers=4)
        self.loaded_scripts: Dict[str, Userscript] = {}
        self.core_libs_b64 = self._load_core_libs()
        self._load_enabled_scripts()

    def _load_enabled_scripts(self):
        self.loaded_scripts = {}
        for entry in self.registry.entries:
            if not entry.enabled or not entry.path:
                continue
            try:
                script = Userscript.load(entry.path)
                self.loaded_scripts[entry.id] = script
                self.registry.update_metadata(entry.id, script.metadata)
                print(f"[UserscriptHost] Loaded script: {entry.name or script.metadata.name}")
            except Exception as exc:
                self.registry.record_error(entry.id, str(exc))
                print(f"[UserscriptHost] Lỗi khi tải script {entry.path}: {exc}")

    def reload_scripts(self):
        self._load_enabled_scripts()
        for controller in list(self._controllers.values()):
            controller._clear_states()

    def shutdown(self):
        self._thread_pool.shutdown(wait=False)

    def attach_view(self, view):
        controller = UserscriptController(self, view)
        self._controllers[view] = controller

    def get_controller(self, view) -> Optional[UserscriptController]:
        return self._controllers.get(view)

    def get_scripts_for_url(self, url: str) -> List[Tuple[UserscriptEntry, Userscript]]:
        matches: List[Tuple[UserscriptEntry, Userscript]] = []
        for entry in self.registry.entries:
            if not entry.enabled:
                continue
            script = self.loaded_scripts.get(entry.id)
            if not script:
                try:
                    script = Userscript.load(entry.path)
                    self.loaded_scripts[entry.id] = script
                    self.registry.update_metadata(entry.id, script.metadata)
                    print(f"[UserscriptHost] Loaded script: {entry.name or script.metadata.name}")
                except Exception as exc:
                    self.registry.record_error(entry.id, str(exc))
                    print(f"[UserscriptHost] Lỗi khi tải script {entry.path}: {exc}")
                    continue
            try:
                if script.matches(url):
                    matches.append((entry, script))
            except Exception as exc:
                print(f"[UserscriptHost] Lỗi match script {entry.path}: {exc}")
        return matches

    def build_bootstrap_script(self, script: Userscript, script_id: str, store: Dict[str, object], environment: Dict[str, object]) -> str:
        payload = script.bootstrap_payload()
        payload["store"] = store
        payload["env"] = environment
        payload["scriptId"] = script_id
        payload["coreLibs"] = self.core_libs_b64
        payload_json = _safe_json_dumps(payload)
        payload_b64 = base64.b64encode(payload_json.encode("utf-8")).decode("ascii")
        script_text = BOOTSTRAP_TEMPLATE.replace("__PAYLOAD_B64__", payload_b64)
        script_text = script_text.replace("{{", "{").replace("}}", "}")
        return script_text

    def open_tab(self, url: str, active: bool, insert: bool):
        if not url:
            return
        switch = True if active is None else bool(active)
        self.window._create_tab(start_url=url, switch=switch)

    def handle_set_value(self, script_id: str, source_controller: UserscriptController, key: str, value):
        old_value = self.storage.set_value(script_id, key, value)
        for controller in list(self._controllers.values()):
            if controller is source_controller:
                continue
            controller.dispatch_value_change(script_id, key, old_value, value)

    def get_menu_commands(self, view) -> List[Dict[str, str]]:
        controller = self.get_controller(view)
        if not controller:
            return []
        return controller.list_menu_commands()

    def execute_menu_command(self, view, script_id: str, command_id: str):
        controller = self.get_controller(view)
        if controller:
            controller.execute_menu_command(script_id, command_id)

    def submit_request(self, controller: UserscriptController, script_id: str, request_id: str, options: Dict[str, object]):
        def task():
            return self._perform_request(options)

        future = self._thread_pool.submit(task)
        controller.track_request_future(script_id, request_id, future)

        def _on_done(fut, ctrl=controller, sid=script_id, rid=request_id):
            if fut.cancelled():
                return
            try:
                success, payload = fut.result()
            except Exception as exc:  # pragma: no cover - defensive
                success, payload = False, {
                    "status": 0,
                    "statusText": str(exc),
                    "responseText": "",
                    "responseHeaders": "",
                    "finalUrl": options.get("url") or "",
                }
            # Ensure callbacks touch Qt objects on the UI thread to avoid crashes.
            dispatcher = getattr(self, "_ui_dispatcher", None)
            if dispatcher:
                dispatcher.submit(lambda: ctrl.dispatch_request_result(sid, rid, success, payload))
            else:  # fallback
                try:
                    ctrl.dispatch_request_result(sid, rid, success, payload)
                except Exception:
                    pass

        future.add_done_callback(_on_done)

    def list_scripts(self) -> List[Dict[str, object]]:
        return self.registry.to_list()

    def register_script(self, path: str, download_url: str = "") -> Dict[str, object]:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Không tìm thấy file: {path}")
        entry = self.registry.add_entry(path, download_url or "", enabled=True)
        self._load_enabled_scripts()
        return entry.to_dict()

    def remove_script(self, script_id: str):
        self.registry.remove_entry(script_id)
        self._load_enabled_scripts()

    def set_script_enabled(self, script_id: str, enabled: bool):
        self.registry.set_enabled(script_id, enabled)
        # Không reload ngay để tránh đơ UI; script sẽ nạp lười khi cần.

    def update_script_from_url(self, script_id: str):
        entry = self.registry.get_entry(script_id)
        if not entry or not entry.download_url:
            raise ValueError("Script không có URL cập nhật.")
        try:
            response = requests.get(entry.download_url, timeout=60)
            response.raise_for_status()
        except Exception as exc:
            raise RuntimeError(f"Không thể tải script: {exc}") from exc
        os.makedirs(os.path.dirname(entry.path), exist_ok=True)
        with open(entry.path, "w", encoding="utf-8") as handle:
            handle.write(response.text)
        self._load_enabled_scripts()

    def set_script_download_url(self, script_id: str, url: str):
        self.registry.set_download_url(script_id, url)

    def _load_core_libs(self) -> List[str]:
        libs = []
        default_libs = [
            os.path.join(BASE_DIR, "download-vietnamese.js")
        ]
        for path in default_libs:
            if not os.path.exists(path):
                continue
            try:
                with open(path, "r", encoding="utf-8") as handle:
                    libs.append(_b64_encode(handle.read()))
            except Exception:
                # Bỏ qua lỗi tải core lib (scripts có thể tự @require)
                continue
        return libs

    def _perform_request(self, options: Dict[str, object]):
        url = options.get("url") or ""
        method = (options.get("method") or "GET").upper()
        headers = options.get("headers") or {}
        data = options.get("data")
        timeout_ms = options.get("timeout") or 60000
        timeout = max(1, int(timeout_ms) / 1000)
        if not url:
            return False, {
                "status": 0,
                "statusText": "invalid-url",
                "responseText": "",
                "responseHeaders": "",
                "finalUrl": "",
            }
        if isinstance(headers, dict):
            headers = {str(k): str(v) for k, v in headers.items()}
        try:
            response = requests.request(
                method,
                url,
                headers=headers,
                data=data,
                timeout=timeout,
            )
            header_lines = "\r\n".join(f"{k}: {v}" for k, v in response.headers.items())
            payload = {
                "status": response.status_code,
                "statusText": response.reason,
                "responseText": response.text,
                "responseHeaders": header_lines,
                "finalUrl": str(response.url),
                "responseBodyB64": base64.b64encode(response.content).decode("ascii"),
            }
            return True, payload
        except Timeout as exc:
            return False, {
                "status": 0,
                "statusText": "timeout",
                "responseText": "",
                "responseHeaders": "",
                "finalUrl": url,
                "timedOut": True,
            }
        except RequestException as exc:  # pragma: no cover - defensive
            return False, {
                "status": 0,
                "statusText": str(exc),
                "responseText": "",
                "responseHeaders": "",
                "finalUrl": url,
            }


BOOTSTRAP_TEMPLATE = r"""
(function() {{
    const PAYLOAD = JSON.parse(atob("__PAYLOAD_B64__"));
    const decodeText = (b64) => {{
        if (!b64) return "";
        try {{
            const binary = atob(b64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {{
                bytes[i] = binary.charCodeAt(i);
            }}
            const decoder = new TextDecoder("utf-8");
            return decoder.decode(bytes);
        }} catch (err) {{
            console.error("[TMHost] decodeText error", err);
            return "";
        }}
    }};
    const toUint8Array = (b64) => {{
        if (!b64) return new Uint8Array(0);
        try {{
            const binary = atob(b64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {{
                bytes[i] = binary.charCodeAt(i);
            }}
            return bytes;
        }} catch (err) {{
            console.error("[TMHost] toUint8Array error", err);
            return new Uint8Array(0);
        }}
    }};
    const cloneVal = (value) => {{
        if (value === undefined) return undefined;
        try {{
            return JSON.parse(JSON.stringify(value));
        }} catch (err) {{
            return value;
        }}
    }};

    window.__tmChannelCallbacks = window.__tmChannelCallbacks || [];
    const ensureChannel = (cb) => {{
        if (window.__tmChannelReady && window.TampermonkeyBridge) {{
            cb();
            return;
        }}
        window.__tmChannelCallbacks.push(cb);
        if (window.__tmChannelInitializing) {{
            return;
        }}
        window.__tmChannelInitializing = true;
        const finishInit = () => {{
            window.__tmChannelInitializing = false;
            const pending = window.__tmChannelCallbacks.splice(0);
            pending.forEach((fn) => {{
                try {{
                    fn();
                }} catch (err) {{
                    console.error("[TMHost] init callback error", err);
                }}
            }});
        }};
        const runChannelInit = () => {{
            if (!qt || !qt.webChannelTransport || !window.QWebChannel) {{
                console.error("[TMHost] Qt WebChannel chưa sẵn sàng.");
                finishInit();
                return;
            }}
            new QWebChannel(qt.webChannelTransport, (channel) => {{
                window.TampermonkeyBridge = channel.objects.TampermonkeyBridge;
                window.__tmChannelReady = true;
                finishInit();
            }});
        }};
        if (window.QWebChannel) {{
            runChannelInit();
            return;
        }}
        if (window.__tmChannelScriptLoading) {{
            return;
        }}
        window.__tmChannelScriptLoading = true;
        const script = document.createElement("script");
        script.src = "qrc:///qtwebchannel/qwebchannel.js";
        script.onload = () => runChannelInit();
        script.onerror = () => {{
            console.error("[TMHost] Không thể tải qwebchannel.js");
            finishInit();
        }};
        (document.head || document.documentElement).appendChild(script);
    }};

    ensureChannel(() => {{
        if (!window.TampermonkeyBridge) {{
            console.error("[TMHost] TampermonkeyBridge không sẵn sàng.");
            return;
        }}
        if (!window.__tmSandboxConsole) {{
            const nativeConsole = window.console;
            const proxy = {{}};
            try {{
                Object.getOwnPropertyNames(nativeConsole).forEach((key) => {{
                    const desc = Object.getOwnPropertyDescriptor(nativeConsole, key);
                    if (!desc) return;
                    if (typeof desc.value === "function") {{
                        proxy[key] = desc.value.bind(nativeConsole);
                    }} else {{
                        Object.defineProperty(proxy, key, {{
                            configurable: true,
                            enumerable: desc.enumerable || false,
                            get: desc.get
                                ? desc.get.bind(nativeConsole)
                                : () => nativeConsole[key],
                            set: desc.set
                                ? (value) => desc.set.call(nativeConsole, value)
                                : (value) => {{ nativeConsole[key] = value; }}
                        }});
                    }}
                }});
            }} catch (err) {{
                console.warn("[TMHost] Không thể tạo sandbox console đầy đủ:", err);
            }}
            window.__tmSandboxConsole = proxy;
        }}
        const console = window.__tmSandboxConsole || window.console;

        window.__tmLoadedScripts = window.__tmLoadedScripts || new Set();
        if (window.__tmLoadedScripts.has(PAYLOAD.scriptId)) {{
            return;
        }}
        window.__tmLoadedScripts.add(PAYLOAD.scriptId);
        const handlerRegistry = window.__tmHandlerRegistry = window.__tmHandlerRegistry || {{
            valueChange: Object.create(null),
            xhrResponse: Object.create(null),
            menuExecute: Object.create(null),
        }};
        const meta = PAYLOAD.meta || {{}};
        const env = PAYLOAD.env || {{}};
        const SCRIPT_ID = PAYLOAD.scriptId || ("script_" + Date.now());
        const gmStore = Object.assign({{}}, PAYLOAD.store || {{}});
        const resources = PAYLOAD.resources || {{}};
        const coreLibs = PAYLOAD.coreLibs || [];
        const requires = PAYLOAD.requires || [];
        const menuCallbacks = Object.create(null);
        const xhrCallbacks = Object.create(null);
        const valueListeners = new Map();
        let valueListenerSeq = 1;

        const notifyValueListeners = (name, oldValue, newValue, remote) => {{
            valueListeners.forEach((listener) => {{
                try {{
                    listener(name, cloneVal(oldValue), cloneVal(newValue), remote);
                }} catch (err) {{
                    console.error("[TMHost] value listener error", err);
                }}
            }});
        }};

        try {{
            coreLibs.forEach((code) => {{
                const lib = decodeText(code);
                if (lib) {{
                    window.eval(lib);
                }}
            }});
        }} catch (err) {{
            console.error("[TMHost] Lỗi khi chạy core lib:", err);
        }}

        handlerRegistry.valueChange[SCRIPT_ID] = (name, oldValue, newValue) => {{
            gmStore[name] = cloneVal(newValue);
            notifyValueListeners(name, oldValue, newValue, true);
        }};

        handlerRegistry.xhrResponse[SCRIPT_ID] = (requestId, payload) => {{
            const cfg = xhrCallbacks[requestId];
            if (!cfg) return;
            const event = {{
                status: payload.status || 0,
                statusText: payload.statusText || "",
                responseHeaders: payload.responseHeaders || "",
                finalUrl: payload.finalUrl || cfg.url || "",
                readyState: 4,
            }};
            if (payload.responseText) {{
                event.responseText = payload.responseText;
            }} else if (payload.responseBodyB64) {{
                try {{
                    event.responseText = decodeText(payload.responseBodyB64);
                }} catch (err) {{
                    event.responseText = "";
                }}
            }} else {{
                event.responseText = "";
            }}
            const responseType = (cfg.responseType || "").toLowerCase();
            if (responseType === "json") {{
                try {{
                    event.response = JSON.parse(event.responseText);
                }} catch (err) {{
                    event.response = null;
                }}
            }} else if (responseType === "document") {{
                try {{
                    event.response = new DOMParser().parseFromString(event.responseText, "text/html");
                }} catch (err) {{
                    event.response = null;
                }}
            }} else if (responseType === "arraybuffer") {{
                const buffer = toUint8Array(payload.responseBodyB64 || "");
                event.response = buffer.buffer;
            }} else {{
                event.response = event.responseText;
            }}
            const timedOut = !!payload.timedOut;
            try {{
                if (timedOut && typeof cfg.ontimeout === "function") {{
                    cfg.ontimeout(event);
                }} else if (payload.success && typeof cfg.onload === "function") {{
                    cfg.onload(event);
                }} else if (!payload.success && typeof cfg.onerror === "function") {{
                    cfg.onerror(event);
                }}
            }} catch (err) {{
                console.error("[TMHost] xhr callback error", err);
            }}
            delete xhrCallbacks[requestId];
        }};

        handlerRegistry.menuExecute[SCRIPT_ID] = (commandId) => {{
            const fn = menuCallbacks[commandId];
            if (fn) {{
                try {{
                    fn();
                }} catch (err) {{
                    console.error("[TMHost] menu callback error", err);
                }}
            }}
        }};

        if (!window.__tm_receiveRemoteValueChange) {{
            window.__tm_receiveRemoteValueChange = (scriptId, name, oldValue, newValue) => {{
                const fn = handlerRegistry.valueChange && handlerRegistry.valueChange[scriptId];
                if (fn) {{
                    fn(name, oldValue, newValue);
                }}
            }};
        }}

        if (!window.__tm_handleXhrResponse) {{
            window.__tm_handleXhrResponse = (scriptId, requestId, payload) => {{
                const fn = handlerRegistry.xhrResponse && handlerRegistry.xhrResponse[scriptId];
                if (fn) {{
                    fn(requestId, payload);
                }}
            }};
        }}

        if (!window.__tm_executeMenuCommand) {{
            window.__tm_executeMenuCommand = (scriptId, commandId) => {{
                const fn = handlerRegistry.menuExecute && handlerRegistry.menuExecute[scriptId];
                if (fn) {{
                    fn(commandId);
                }}
            }};
        }}

        const GM_getValue = (key, defaultValue) => {{
            return Object.prototype.hasOwnProperty.call(gmStore, key)
                ? cloneVal(gmStore[key])
                : defaultValue;
        }};

        const GM_setValue = (key, value) => {{
            const oldValue = Object.prototype.hasOwnProperty.call(gmStore, key)
                ? cloneVal(gmStore[key])
                : undefined;
            gmStore[key] = cloneVal(value);
            notifyValueListeners(key, oldValue, value, false);
            try {{
                let serialized;
                try {{
                    serialized = JSON.stringify(value);
                }} catch (err) {{
                    serialized = JSON.stringify(String(value));
                }}
                if (serialized === undefined) {{
                    serialized = "null";
                }}
                window.TampermonkeyBridge.gmSetValue(SCRIPT_ID, key, serialized);
            }} catch (err) {{
                console.error("[TMHost] gmSetValue error", err);
            }}
        }};

        const GM_addValueChangeListener = (name, callback) => {{
            if (typeof callback !== "function") return null;
            const id = valueListenerSeq++;
            valueListeners.set(id, (changedName, oldValue, newValue, remote) => {{
                if (name && changedName !== name) return;
                callback(changedName, cloneVal(oldValue), cloneVal(newValue), remote);
            }});
            return id;
        }};

        const GM_removeValueChangeListener = (id) => {{
            valueListeners.delete(id);
        }};

        const GM_getResourceText = (name) => {{
            const value = resources[name];
            return value ? decodeText(value) : null;
        }};

        const GM_openInTab = (url, options) => {{
            if (!url) return;
            try {{
                const hasActive = options && Object.prototype.hasOwnProperty.call(options, "active");
                const shouldActivate = hasActive ? !!options.active : true;
                window.TampermonkeyBridge.gmOpenInTab(
                    SCRIPT_ID,
                    url,
                    shouldActivate,
                    !!(options && options.insert)
                );
            }} catch (err) {{
                window.open(url, "_blank");
            }}
        }};

        const GM_registerMenuCommand = (title, callback) => {{
            if (!title || typeof callback !== "function") return null;
            const commandId = "cmd_" + Date.now() + "_" + Math.random().toString(16).slice(2);
            menuCallbacks[commandId] = callback;
            try {{
                window.TampermonkeyBridge.gmRegisterMenuCommand(SCRIPT_ID, commandId, title);
            }} catch (err) {{
                console.error("[TMHost] gmRegisterMenuCommand error", err);
            }}
            return commandId;
        }};

        const GM_unregisterMenuCommand = (commandId) => {{
            delete menuCallbacks[commandId];
            try {{
                window.TampermonkeyBridge.gmUnregisterMenuCommand(SCRIPT_ID, commandId);
            }} catch (err) {{
                console.error("[TMHost] gmUnregisterMenuCommand error", err);
            }}
        }};

        const GM_xmlhttpRequest = (options) => {{
            if (!options || !options.url) {{
                throw new Error("GM_xmlhttpRequest: thiếu URL");
            }}
            const requestId = "xhr_" + Date.now() + "_" + Math.random().toString(16).slice(2);
            xhrCallbacks[requestId] = options;
            const payload = {{
                method: (options.method || "GET").toUpperCase(),
                url: options.url,
                headers: options.headers || {{}},
                data: options.data || null,
                timeout: Math.max(1000, Number(options.timeout) || 60000)
            }};
            if (payload.data && typeof payload.data !== "string") {{
                try {{
                    payload.data = JSON.stringify(payload.data);
                }} catch (err) {{
                    payload.data = String(payload.data);
                }}
            }}
            try {{
                window.TampermonkeyBridge.gmXmlHttpRequest(SCRIPT_ID, requestId, JSON.stringify(payload));
            }} catch (err) {{
                delete xhrCallbacks[requestId];
                setTimeout(() => {{
                    options.onerror && options.onerror({{ success: false, status: 0, statusText: String(err) }});
                }}, 0);
            }}
            return {{
                abort: () => {{
                    try {{
                        window.TampermonkeyBridge.gmAbortXmlHttpRequest(SCRIPT_ID, requestId);
                    }} catch (err) {{
                        console.error("[TMHost] gmAbortXmlHttpRequest error", err);
                    }}
                }}
            }};
        }};

        window.GM_info = {{
            script: {{
                name: meta.name || "Userscript",
                version: meta.version || "0.0.0",
                description: meta.description || "",
                namespace: meta.namespace || "",
                matches: meta.matches || [],
                includes: meta.includes || [],
            }},
            scriptMetaStr: meta.metaStr || "",
            scriptHandler: env.handlerName || "RenameChaptersTamperHost",
            version: env.handlerVersion || "0.1.0",
            platform: env.platform || {{}},
        }};

        const GM = {{
            getValue: GM_getValue,
            setValue: GM_setValue,
            addValueChangeListener: GM_addValueChangeListener,
            removeValueChangeListener: GM_removeValueChangeListener,
            getResourceText: GM_getResourceText,
            registerMenuCommand: GM_registerMenuCommand,
            unregisterMenuCommand: GM_unregisterMenuCommand,
            openInTab: GM_openInTab,
            xmlhttpRequest: GM_xmlhttpRequest,
        }};

        window.GM = GM;
        window.GM_getValue = GM_getValue;
        window.GM_setValue = GM_setValue;
        window.GM_addValueChangeListener = GM_addValueChangeListener;
        window.GM_removeValueChangeListener = GM_removeValueChangeListener;
        window.GM_getResourceText = GM_getResourceText;
        window.GM_registerMenuCommand = GM_registerMenuCommand;
        window.GM_unregisterMenuCommand = GM_unregisterMenuCommand;
        window.GM_openInTab = GM_openInTab;
        window.GM_xmlhttpRequest = GM_xmlhttpRequest;
        window.unsafeWindow = window;

        try {{
            requires.forEach((item) => {{
                const code = decodeText(item.code);
                if (code) {{
                    window.eval(code);
                }}
            }});
        }} catch (err) {{
            console.error("[TMHost] Lỗi khi chạy @require:", err);
        }}

        try {{
            const code = decodeText(PAYLOAD.script);
            if (code) {{
                window.eval(code);
            }}
        }} catch (err) {{
            console.error("[TMHost] Lỗi khi chạy userscript:", err);
        }}
    }});
})();
"""
