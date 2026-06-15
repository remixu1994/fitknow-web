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
    fat_loss = [plan for plan in data["dietPlans"] if plan["goal"] == "fat-loss"]
    meal_table_counts = {
        plan["title"]: [table["dayType"] for table in plan.get("mealTables", [])]
        for plan in fat_loss
    }
    lunch_before = next(plan for plan in fat_loss if "午饭前练" in plan["title"])
    lunch_after = next(plan for plan in fat_loss if "午饭后练" in plan["title"])
    no_strength = next(plan for plan in fat_loss if "无力训者" in plan["title"])
    lunch_before_training = next(table for table in lunch_before["mealTables"] if table["dayType"] == "training")
    lunch_after_training = next(table for table in lunch_after["mealTables"] if table["dayType"] == "training")
    before_lunch = next(meal for meal in lunch_before_training["meals"] if "午饭" in meal["name"])
    after_lunch = next(meal for meal in lunch_after_training["meals"] if "午饭" in meal["name"])

    assert len(data["sheets"]) == 30, "expected 30 sheets"
    assert len(data["dietPlans"]) == 15, "expected 15 diet plans"
    assert len(fat_loss) == 8, "expected 8 fat-loss plans"
    assert all(plan.get("mealTables") for plan in fat_loss), "expected structured fat-loss meal tables"
    assert all({"training", "rest"}.issubset(set(day_types)) for title, day_types in meal_table_counts.items() if "无力训者" not in title), "expected training/rest meal tables"
    assert "daily" in meal_table_counts[no_strength["title"]] and no_strength.get("dailyMeals"), "expected no-strength daily meals"
    assert before_lunch["mealType"] == "postworkout" and before_lunch["carbPercent"] == 35 and before_lunch["proteinPercent"] == 30, "lunch-before workout meal mismatch"
    assert after_lunch["mealType"] == "preworkout" and after_lunch["carbPercent"] == 15 and after_lunch["proteinPercent"] == 0, "lunch-after preworkout meal mismatch"
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
        "fatLossMealTables": meal_table_counts,
        "oneRepMaxAdams": one_rm["Adams"],
        "cardioFirst": first_cardio,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
