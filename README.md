# Keyon's AI Frontier

Daily AI 前沿速览 · 聚焦 Agent 自进化 / A2A 协议 / Agentic 架构 / Harness 工程

## 本地预览

任意静态服务器即可，例如：

```bash
cd ai-frontier
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000/
```

> 直接 file:// 打开会因为浏览器 CORS 拒绝 fetch JSON 而显示空白，必须用 http 服务器。

## 目录

```
index.html                 # 入口
assets/style.css           # 样式
assets/app.js              # 渲染逻辑（搜索 / 7 日切换 / 快捷键）
data/manifest.json         # 7 日清单（自动维护）
data/daily/YYYY-MM-DD.json # 每日内容
scripts/fetch_rss.py       # RSS 抓取脚本（HN / arXiv 等）
.github/workflows/daily.yml# 每日 09:00 北京时间自动运行
```

## 发布到 GitHub Pages

直接跑：

```bash
cd ~/Documents/alibaba/obsidian/work/ai-frontier
bash init.sh
```

脚本会引导你建仓 → 推代码 → 开 Pages。完成后访问：
**https://keyon-2580.github.io/keyon-ai-daily/**

## 自动化架构

```
┌─ GitHub Action (每天 09:00 UTC+8，跑在 GitHub 服务器)
│   └─ python3 scripts/fetch_rss.py   ← 抓 HN/arXiv 写 data/daily/今天.json
│
└─ Claude scheduled task (每天 09:30，跑在你电脑)
    ├─ 读今天的 JSON，加工「今日洞见」和 4 个 Keyon 分类的评论
    └─ bash scripts/enrich_and_push.sh ← commit + push
```

第一层不依赖 Claude，纯机械刷新。第二层把当日内容变成"有思考的日报"。
如果某天 Claude 没跑成功，你在聊天里说一句"/刷一下"就触发手动重跑。

## 自定义 RSS 源

编辑 `scripts/fetch_rss.py` 顶部的 `FEEDS` 字典。每天 09:00 (UTC+8) 自动抓取、写入新 JSON、删掉超过 7 天的旧 JSON、刷新 manifest。
