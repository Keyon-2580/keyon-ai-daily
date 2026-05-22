#!/usr/bin/env bash
# Claude scheduled task 收尾用：commit + push 今天加工后的 JSON
# Claude 写完今日 JSON 后调用此脚本。
set -e
cd "$(dirname "$0")/.."

TODAY=$(date +%F)
JSON="data/daily/${TODAY}.json"

if [ ! -f "$JSON" ]; then
  echo "[skip] $JSON 不存在，GitHub Action 可能还没跑。"
  exit 0
fi

git add data/
if git diff --cached --quiet; then
  echo "[skip] 今日 JSON 无变化，不提交。"
  exit 0
fi

git commit -m "chore(daily): Claude 加工 ${TODAY} 今日洞见 + Keyon 关联评论"
git push origin main
echo "[ok] 已推送 ${TODAY}。GitHub Pages 1-2 分钟后刷新。"
