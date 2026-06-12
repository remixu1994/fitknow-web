from __future__ import annotations

import json
import math
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data" / "generated" / "workbook.json"


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    data = json.loads(DATA.read_text(encoding="utf-8"))
    image_refs = [
        image["src"]
        for gallery in data["anatomy"]["imageGalleries"]
        for image in gallery["images"]
    ]
    missing = []
    opened = 0
    for ref in image_refs:
        path = ROOT / "public" / ref
        if not path.exists():
            missing.append(ref)
            continue
        with Image.open(path) as image:
            if image.width > 0 and image.height > 0:
                opened += 1

    one_rm = {row["author"]: row["example"] for row in data["oneRepMax"]}
    assert len(data["sheets"]) == 30, "expected 30 sheets"
    assert len(data["dietPlans"]) == 15, "expected 15 diet plans"
    assert len(data["trainingPlans"]) == 4, "expected 4 training plans"
    assert len(data["foods"]) >= 100, "expected food database"
    assert len(data["qa"]) >= 40, "expected QA database"
    assert len(image_refs) >= 35 and not missing and opened == len(image_refs), "image validation failed"
    assert math.isclose(one_rm["Adams"], 62.5), "Adams example mismatch"
    assert math.isclose(one_rm["Brzycki"], 66.68, abs_tol=0.01), "Brzycki example mismatch"
    first_cardio = data["cardio"][0]
    assert first_cardio["restingHeartRate"] == "60" and first_cardio["exerciseHeartRate"] == "120", "cardio first row mismatch"

    print(json.dumps({
        "sheets": len(data["sheets"]),
        "dietPlans": len(data["dietPlans"]),
        "qa": len(data["qa"]),
        "foods": len(data["foods"]),
        "trainingPlans": len(data["trainingPlans"]),
        "images": opened,
        "oneRepMaxAdams": one_rm["Adams"],
        "cardioFirst": first_cardio,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
