#!/usr/bin/env bash
# 一次性初始化脚本：建仓 -> 推到 GitHub -> 提示打开 Pages 设置
# 用法：bash init.sh
set -e

REPO_USER="Keyon-2580"
REPO_NAME="keyon-ai-daily"
REMOTE_SSH="git@github.com:${REPO_USER}/${REPO_NAME}.git"
REMOTE_HTTPS="https://github.com/${REPO_USER}/${REPO_NAME}.git"

cd "$(dirname "$0")"

echo "==> 1. 先在浏览器里手动建一个空仓库（不要勾任何 README/gitignore）："
echo "    https://github.com/new"
echo "    Repository name: ${REPO_NAME}"
echo "    Owner: ${REPO_USER}"
echo "    Visibility: Public（GitHub Pages 免费版要 Public）"
read -p "==> 建好按回车继续，未建按 Ctrl+C 退出..." _

if [ ! -d .git ]; then
  git init
  git branch -M main
fi

git add .
git commit -m "init: keyon AI daily frontier" || echo "(nothing to commit)"

# 优先用 ssh，失败回退 https
if git remote | grep -q origin; then
  git remote set-url origin "$REMOTE_SSH"
else
  git remote add origin "$REMOTE_SSH"
fi

echo "==> 2. 推到 GitHub..."
if ! git push -u origin main; then
  echo "==> SSH 推失败，回退到 HTTPS（会让你输 GitHub token / 浏览器登录）"
  git remote set-url origin "$REMOTE_HTTPS"
  git push -u origin main
fi

echo
echo "==> 3. 打开 Pages 设置（最后一步手动）："
echo "    https://github.com/${REPO_USER}/${REPO_NAME}/settings/pages"
echo "    Source 选 'Deploy from a branch'"
echo "    Branch  选 'main' / '(root)'，保存"
echo
echo "==> 4. 一两分钟后访问："
echo "    https://${REPO_USER,,}.github.io/${REPO_NAME}/"
echo
echo "==> 5. （可选）手动跑一次每日抓取："
echo "    https://github.com/${REPO_USER}/${REPO_NAME}/actions/workflows/daily.yml"
echo "    点 'Run workflow' -> 选 main -> 跑一次试试"
