"""JSON adapter for the public legacy renamer embedded above this script."""

import json
import sys


def scan_rename(request):
    folder = request["folder"]
    if request["regular_files_only"]:
        with os.scandir(folder) as entries:
            files = [entry.name for entry in entries
                     if entry.name.lower().endswith(".txt") and entry.is_file(follow_symlinks=False)]
    else:
        files = [name for name in os.listdir(folder) if name.lower().endswith(".txt")]
    rows = []
    for name in files:
        row = analyze_file(
            os.path.join(folder, name),
            request["filename_regexes"],
            request["content_regexes"],
        )
        del row["filepath"]
        for field in ("from_filename", "from_content"):
            match = row[field]
            if match["num"] is not None:
                match["num"] = str(match["num"])
        rows.append(row)
    return rows


def format_rename(request):
    names = []
    for index, row in enumerate(request["rows"]):
        for field in ("from_filename", "from_content"):
            match = row[field]
            if match["num"] is not None:
                match["num"] = int(match["num"])
        args = (row, request["strategy"], request["name_format"])
        options = {"custom_titles": request["custom_titles"], "file_index": index}
        proposed_name = generate_new_name(*args, **options)
        first_line = None
        if request["include_first_line"] and proposed_name is not None:
            raw_name = generate_new_name(*args, **options, sanitize_output=False)
            if raw_name:
                first_line = os.path.splitext(raw_name)[0]
        names.append({"proposed_name": proposed_name, "first_line": first_line})
    return names


if __name__ == "__main__":
    request = json.load(sys.stdin.buffer)
    result = scan_rename(request["scan"]) if "scan" in request else format_rename(request)
    print(json.dumps(result))
