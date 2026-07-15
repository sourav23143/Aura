import urllib.request, json, os

file_path = 'c:/Users/ASUS/ABC/cortex-ai/backend/data/seed/documents.json'
with open(file_path, 'r') as f:
    data = json.load(f)

for d in data:
    url = d.get('image_url')
    if url:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            urllib.request.urlopen(req)
        except Exception:
            print(f"Replacing broken URL for {d['id']}")
            d['image_url'] = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop'

with open(file_path, 'w') as f:
    json.dump(data, f, indent=2)

if os.path.exists('c:/Users/ASUS/ABC/cortex-ai/backend/data/cortex.db'):
    try:
        os.remove('c:/Users/ASUS/ABC/cortex-ai/backend/data/cortex.db')
        print("Database reset.")
    except Exception as e:
        print(e)
