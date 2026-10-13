"""Scarica una volta i caratteri (Anton, Inter) e li salva in fonts/,
così il sito non contatta Google Fonts (nessun dato dei visitatori inviato a Google).
Eseguito da GitHub Actions solo se fonts/fonts.css non esiste ancora."""
import os, re, urllib.request

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
CSS_URL = "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
KEEP = {"latin", "latin-ext"}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read()

css = get(CSS_URL).decode()
blocks = re.findall(r"/\* ([\w-]+) \*/\s*(@font-face \{.*?\})", css, re.S)
os.makedirs(OUT, exist_ok=True)
out = []
for subset, block in blocks:
    if subset not in KEEP:
        continue
    fam = re.search(r"font-family: '([^']+)'", block).group(1).replace(" ", "")
    wt = re.search(r"font-weight: (\d+)", block).group(1)
    url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
    name = f"{fam}-{wt}-{subset}.woff2"
    with open(os.path.join(OUT, name), "wb") as f:
        f.write(get(url))
    out.append(f"/* {subset} */\n" + block.replace(url, name))
with open(os.path.join(OUT, "fonts.css"), "w") as f:
    f.write("\n".join(out) + "\n")
print(f"Salvati {len(out)} file di carattere")
