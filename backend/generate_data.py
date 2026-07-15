import json
import random

with open("data/seed/documents.json", "r", encoding="utf-8") as f:
    base_docs = json.load(f)

categories = ["Smart Infrastructure", "STEM Labs", "Software & ERP", "Digital Content"]
levels = ["K-12", "Middle/High School", "All Levels", "High School", "Primary/Middle School", "University"]

new_docs = base_docs.copy() # keep the original 10

for i in range(11, 1501):
    base = random.choice(base_docs)
    new_doc = base.copy()
    new_doc["id"] = f"b2b-{i:04d}"
    # Slightly modify the title to make it unique
    new_doc["title"] = f"{base['title']} - Model {random.randint(100, 999)}{chr(random.randint(65, 90))}"
    new_doc["price_usd"] = random.randint(500, 10000)
    new_doc["target_level"] = random.choice(levels)
    new_doc["category"] = random.choice(categories)
    new_docs.append(new_doc)

with open("data/seed/documents.json", "w", encoding="utf-8") as f:
    json.dump(new_docs, f, indent=2)

print(f"Successfully generated {len(new_docs)} documents in data/seed/documents.json.")
