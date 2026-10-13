"""Legge il feed pubblico del canale YouTube e salva gli ultimi video in assets/data/videos.json.
Eseguito automaticamente da GitHub Actions (vedi .github/workflows/youtube.yml)."""
import json, os, sys, urllib.request
import xml.etree.ElementTree as ET

CHANNEL_ID = os.environ.get("YT_CHANNEL_ID", "").strip()
MAX = int(os.environ.get("YT_MAX", "6"))
EXCLUDE_SHORTS = os.environ.get("YT_EXCLUDE_SHORTS", "false").lower() == "true"
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "data", "videos.json")

if not CHANNEL_ID.startswith("UC"):
    sys.exit("YT_CHANNEL_ID mancante o non valido (deve iniziare con UC)")

url = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
xml = urllib.request.urlopen(req, timeout=30).read()

ns = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015", "media": "http://search.yahoo.com/mrss/"}
root = ET.fromstring(xml)
videos = []
for e in root.findall("a:entry", ns):
    link = e.find("a:link", ns).get("href", "")
    if EXCLUDE_SHORTS and "/shorts/" in link:
        continue
    vid = e.find("yt:videoId", ns).text
    videos.append({
        "id": vid,
        "thumb": f"assets/img/yt/{vid}.jpg",
        "title": e.find("a:title", ns).text,
        "published": e.find("a:published", ns).text[:10],
        "short": "/shorts/" in link,
    })
    if len(videos) >= MAX:
        break

# Anteprime salvate sul sito: il visitatore non contatta Google finché non preme play
THUMBS = os.path.join(os.path.dirname(__file__), "..", "assets", "img", "yt")
os.makedirs(THUMBS, exist_ok=True)
keep = set()
for v in videos:
    path = os.path.join(THUMBS, v["id"] + ".jpg"); keep.add(v["id"] + ".jpg")
    if not os.path.exists(path):
        img = urllib.request.urlopen(urllib.request.Request(f"https://i.ytimg.com/vi/{v['id']}/hqdefault.jpg", headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read()
        open(path, "wb").write(img)
for f in os.listdir(THUMBS):
    if f.endswith(".jpg") and f not in keep:
        os.remove(os.path.join(THUMBS, f))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump({"updated": root.find("a:entry/a:updated", ns).text if videos else None, "videos": videos}, f, ensure_ascii=False, indent=2)
print(f"Salvati {len(videos)} video")
