#!/usr/bin/env python3
"""Fetch RSS feeds, build today's JSON, update manifest, prune >7 day files.

Run: python3 scripts/fetch_rss.py
Designed for GitHub Actions (see .github/workflows/daily.yml).
"""
from __future__ import annotations
import json, os, re, sys, datetime as dt, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DAILY = DATA / "daily"
DAILY.mkdir(parents=True, exist_ok=True)

# ---- Feeds (edit me) -------------------------------------------------------
FEEDS = {
  "oss": [
    "https://hnrss.org/newest?q=agent+OR+LLM&count=20",
  ],
  "research": [
    "https://export.arxiv.org/rss/cs.AI",
    "https://export.arxiv.org/rss/cs.MA",
  ],
  "industry": [
    "https://hnrss.org/frontpage?q=OpenAI+OR+Anthropic+OR+Google",
  ],
  "voices": [],
  "china": [],
}
KEYON_TAGS = {
  "agent 自进化":  ["self-improv", "self-train", "reflexion", "rollout"],
  "a2a":          ["a2a", "agent-to-agent", "mcp ", "multi-agent"],
  "agentic":      ["agentic", "agent runtime", "langgraph", "plan-execute"],
  "harness":      ["eval", "harness", "trace", "benchmark", "observability"],
}

def fetch(url: str, timeout: int = 20) -> str:
  req = urllib.request.Request(url, headers={"User-Agent":"keyon-ai-frontier/1.0"})
  with urllib.request.urlopen(req, timeout=timeout) as r:
    return r.read().decode("utf-8", errors="replace")

def parse_rss(xml: str):
  out = []
  try:
    root = ET.fromstring(xml)
  except ET.ParseError:
    return out
  ns = {"atom":"http://www.w3.org/2005/Atom"}
  for item in root.iter("item"):
    title = (item.findtext("title") or "").strip()
    link  = (item.findtext("link")  or "").strip()
    desc  = re.sub("<[^>]+>", "", item.findtext("description") or "")[:300].strip()
    if title and link:
      out.append({"title":title,"summary":desc,"url":link})
  for entry in root.iter("{http://www.w3.org/2005/Atom}entry"):
    title = (entry.findtext("atom:title",namespaces=ns) or "").strip()
    link_el = entry.find("atom:link",namespaces=ns)
    link  = link_el.get("href") if link_el is not None else ""
    summ  = re.sub("<[^>]+>","", entry.findtext("atom:summary",namespaces=ns) or "")[:300].strip()
    if title and link:
      out.append({"title":title,"summary":summ,"url":link})
  return out

def classify_keyon(item):
  t = (item["title"] + " " + item.get("summary","")).lower()
  for topic, kws in KEYON_TAGS.items():
    if any(k in t for k in kws):
      return topic
  return None

def build_today():
  today = dt.date.today().isoformat()
  data = {
    "date": today,
    "insight": {"author":"auto","html":f"<p>{today} · RSS 自动聚合稿。等待 Claude 后续生成洞见。</p>"},
    "hot": [], "keyon": [
      {"topic":"Agent 自进化","color":"emerald","items":[]},
      {"topic":"A2A 协议","color":"violet","items":[]},
      {"topic":"Agentic 架构","color":"amber","items":[]},
      {"topic":"Harness 工程","color":"rose","items":[]},
    ],
    "oss":[], "voices":[], "industry":[], "research":[], "china":[],
  }
  topic_idx = {"agent 自进化":0,"a2a":1,"agentic":2,"harness":3}
  seen = set()
  for section, urls in FEEDS.items():
    for url in urls:
      try:
        items = parse_rss(fetch(url))
      except Exception as e:
        print(f"[warn] {url}: {e}", file=sys.stderr); continue
      for it in items[:8]:
        if it["url"] in seen: continue
        seen.add(it["url"])
        it["source"] = url.split("//")[1].split("/")[0]
        it["tags"]   = []
        data[section].append(it)
        tk = classify_keyon(it)
        if tk:
          data["keyon"][topic_idx[tk]]["items"].append({
            "title": it["title"], "comment": "（自动归类，待人工 review）",
            "source": it["source"], "url": it["url"],
          })
  data["hot"] = (data["oss"][:4] + data["research"][:4])[:8]
  for i,h in enumerate(data["hot"]):
    h.setdefault("score", 7); h.setdefault("tags",[]); h.setdefault("badges",[])
  return data

def write_today(data):
  p = DAILY / f"{data['date']}.json"
  p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
  print("wrote", p)

def prune_and_manifest(keep=7):
  files = sorted(DAILY.glob("*.json"))
  dates = [f.stem for f in files if re.fullmatch(r"\d{4}-\d{2}-\d{2}", f.stem)]
  dates.sort(reverse=True)
  keep_set = set(dates[:keep])
  for f in files:
    if f.stem not in keep_set:
      print("prune", f); f.unlink()
  manifest = {"updatedAt": dt.datetime.now().isoformat(),
              "dates":[{"date":d,"count":count_in(d)} for d in sorted(keep_set, reverse=True)]}
  (DATA/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2), encoding="utf-8")
  print("wrote manifest.json")

def count_in(date):
  try:
    d = json.loads((DAILY/f"{date}.json").read_text(encoding="utf-8"))
    return (len(d.get("hot",[]))
            + sum(len(c.get("items",[])) for c in d.get("keyon",[]))
            + sum(len(d.get(k,[])) for k in ("oss","voices","industry","research","china")))
  except Exception: return 0

if __name__ == "__main__":
  write_today(build_today())
  prune_and_manifest(7)
