"""Legge il feed pubblico del canale YouTube e salva gli ultimi video in videos.json.
Eseguito automaticamente da GitHub Actions (vedi .github/workflows/youtube.yml).

Se YouTube non risponde o risponde con un errore (capita, soprattutto di notte),
riprova 3 volte e poi esce SENZA errore, lasciando i video già salvati."""
import json, os, sys, time, urllib.request, urllib.error
import xml.etree.ElementTree as ET

CHANNEL_ID = os.environ.get("YT_CHANNEL_ID", "").strip()
MAX = int(os.environ.get("YT_MAX", "6"))
EXCLUDE_SHORTS = os.environ.get("YT_EXCLUDE_SHORTS", "false").lower() == "true"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "videos.json")
THUMBS = os.path.join(HERE, "yt")
UA = {"User-Agent": "Mozilla/5.0 (compatible; alessandromarchetti.net)"}

if not CHANNEL_ID.startswith("UC"):
    print("YT_CHANNEL_ID mancante o non valido: niente da fare")
    sys.exit(0)

def fetch(url, tries=3):
    last = None
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 404:          # canale senza video: inutile riprovare
                break
        except Exception as e:         # timeout, connessione chiusa, DNS...
            last = e
        time.sleep(10 * (i + 1))
    raise last

def keep_old(reason):
    print(f"YouTube non disponibile ({reason}): mantengo i video già salvati")
    if not os.path.exists(OUT):
        with open(OUT, "w", encoding="utf-8") as f:
            json.dump({"updated": None, "videos": []}, f)
    sys.exit(0)

try:
    xml = fetch(f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}")
    root = ET.fromstring(xml)
except Exception as e:
    keep_old(e)

ns = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}
videos = []
for e in root.findall("a:entry", ns):
    try:
        link = e.find("a:link", ns).get("href", "")
        if EXCLUDE_SHORTS and "/shorts/" in link:
            continue
        vid = e.find("yt:videoId", ns).text
        videos.append({
            "id": vid,
            "thumb": f"yt/{vid}.jpg",
            "title": e.find("a:title", ns).text,
            "published": e.find("a:published", ns).text[:10],
            "short": "/shorts/" in link,
        })
    except Exception:
        continue
    if len(videos) >= MAX:
        break

# Anteprime salvate sul sito: il visitatore non contatta Google finché non preme play
os.makedirs(THUMBS, exist_ok=True)
keep = set()
for v in videos:
    name = v["id"] + ".jpg"
    path = os.path.join(THUMBS, name)
    if not os.path.exists(path):
        try:
            open(path, "wb").write(fetch(f"https://i.ytimg.com/vi/{v['id']}/hqdefault.jpg"))
        except Exception:
            v["thumb"] = ""            # niente anteprima: il sito mostra un riquadro col titolo
            continue
    keep.add(name)
for f in os.listdir(THUMBS):
    if f.endswith(".jpg") and f not in keep:
        os.remove(os.path.join(THUMBS, f))

with open(OUT, "w", encoding="utf-8") as f:
    json.dump({"updated": videos[0]["published"] if videos else None, "videos": videos}, f, ensure_ascii=False, indent=2)
print(f"Salvati {len(videos)} video")
