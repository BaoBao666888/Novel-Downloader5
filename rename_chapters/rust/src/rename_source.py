"""JSON adapter for the public legacy renamer embedded above this script."""

import json
import sys


def scan_rename(request):
    folder = request["folder"]
    filenames = [name for name in os.listdir(folder) if name.lower().endswith(".txt")]
    rows = []
    for name in filenames:
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
        names.append(generate_new_name(
            row, request["strategy"], request["name_format"],
            custom_titles=request["custom_titles"], file_index=index,
        ))
    return names


if __name__ == "__main__":
    request = json.load(sys.stdin.buffer)
    result = scan_rename(request["scan"]) if "scan" in request else format_rename(request)
    print(json.dumps(result))
