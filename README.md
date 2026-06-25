# FitKnow Web

FitKnow Web 是基于 B 站博主 [好人松松](https://space.bilibili.com/2078781964?spm_id_from=333.1391.0.0) 提供的《健身 Excel 超级套表》整理开发的非官方 Web 便捷版。

这个项目的目标是把原本需要在 Excel 里翻找、计算和核对的健身内容，整理成更适合日常使用的网页工具，帮助大家快速查询训练方案、计算增肌减脂饮食热量、查看食物换算和定位原表来源。

原始表格内容来自好人松松分享的健身 Excel 超级套表。感谢博主对健身知识的整理和分享，建议关注博主主页和相关视频获取原始说明、更新信息与完整背景。

## 功能概览

- 减脂饮食：按训练时间选择减脂饮食路径，查看力训日、休息日和执行说明。
- 增肌饮食：按训练时间选择增肌饮食路径，估算目标热量和三大营养素。
- 训练计划：查看健身房和居家训练计划，按分化方式、训练日和动作查询。
- 热量工具：提供有氧热量消耗、最大力量 1RM 预测和食物重量换算。
- 食物营养：查询常见碳水、蛋白质食物的营养率和原表解释。
- 问答库：整理减脂、增肌过程中常见问题和原表回答。
- 拉伸解剖：查看拉伸图示、关节活动与参与肌肉关系。
- 原表索引：保留 Sheet 分类、原始行号和来源追溯，便于回到 Excel 核对。

## 当前数据规模

- 30 张原始 Sheet
- 15 个饮食方案
- 4 套训练计划
- 102 条食物营养条目
- 57 条问答内容
- 66 条有氧热量数据
- 9 个 1RM 预测公式
- 35 张拉伸与解剖图示

数据来源文件为 `【可任意分享】健身Excel超级套表（作者：B站好人松松）26年4月最新版.xlsx`，项目会把 Excel 内容抽取成结构化 JSON，并保留可追溯的 Sheet 与行号信息。

## 本地运行

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

## 数据更新与校验

从 Excel 重新抽取结构化数据：

```bash
npm run extract
```

校验生成数据、图片资源和关键计算示例：

```bash
npm run verify:data
```

抽取脚本会生成 `src/data/generated/workbook.json`，并整理 `public/generated/assets` 下的图片和原始表格资源。

## 项目声明

本项目是基于公开分享资料整理的非官方 Web 版本，主要用于健身学习、饮食估算、训练参考和个人使用便利化。

页面中的热量、营养素和训练建议仅供参考，不能替代医生、营养师、康复师或专业教练的个性化建议。如果存在疾病、伤病、特殊饮食要求或训练风险，请优先咨询专业人士。

如需了解原始内容背景、表格使用方法或作者更新，请关注 B 站博主 [好人松松](https://space.bilibili.com/2078781964?spm_id_from=333.1391.0.0)。

## Development Requirements

- Node.js 20+
- npm
- Python 3.10+ available on PATH as `python`, `python3`, or Windows `py`
- `openpyxl` installed for `npm run extract`

Install Python dependencies when regenerating data:

```bash
python -m pip install openpyxl
# or, on systems where Python is exposed as python3:
python3 -m pip install openpyxl
```

Recommended verification commands before commit:

```bash
npm run extract
npm run verify:data
npm test
npm run typecheck
npm run build
```

`scripts/run-python.mjs` tries `PYTHON`, then `python`, `python3`, `py`, and finally falls back to the local Codex runtime Python when available. `npm run verify:data` uses only the Python standard library for image checks; `npm run extract` requires `openpyxl`.
