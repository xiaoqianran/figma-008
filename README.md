# CARGO — 高保真 Figma 复刻（完整套件）

[![Deploy (GitHub Pages)](https://github.com/OWNER/REPO/actions/workflows/deploy.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/deploy.yml)

**「CARGO - Car Booking & Sharing App」设计系统的像素级、完全可交互的网页复刻版**，来源于已连接的 Figma 文件（组件总览页 + 20+ 个生产级屏幕）。

项目采用 2026 年主流最佳实践技术栈构建为现代化生产级 PWA：React 19 + Vite + Tailwind v4 + Framer Motion + MapLibre + Zustand + React Hook Form + Zod。

> 目标：与 Figma 中呈现的每一个屏幕、组件、流程和细节实现 1:1 的视觉与交互保真度，并将其实现为一个真正可用的应用程序（而非静态原型）。

---

## 当前状态（第一阶段已完成）

- ✅ 完整的 iPhone X 设备框架查看器（精确 375×812，边框、状态栏、主屏幕指示器）
- ✅ 认证与新手引导流程：启动页 → 注册（手机号 + 社交登录）→ 登录 → 验证码 → 开启定位
- ✅ 核心预订引擎：
  - 首页（快速入口 + 推荐出行）
  - **交互式 MapLibre GL 目的地选择器**（支持拖拽选点、点击选点、Nominatim 反向地理编码、Photon 搜索自动补全、浏览器定位 + 旧金山兜底、直线路线预览、动态价格估算）
  - 选择服务（4 种车型：经济型 / 舒适型 / 高级型 / 大型车，含价格与预计到达时间）
  - 支付（3 种支付方式 + 优惠码 + 完整确认 + 历史记录）
- ✅ 全局预订状态管理（Zustand + localStorage 持久化）
- ✅ 流畅的屏幕过渡动画（Framer Motion）
- ✅ PWA 支持（Manifest + Service Worker，通过 vite-plugin-pwa 实现）
- ✅ 设计令牌与基础组件已与 Figma 精确对齐（按钮高度 44/60px、输入框、卡片、配色、SF Pro 字体栈）
- ✅ 通过 MCP 直接从 Figma 导出的 15+ 张高分辨率参考截图

**后续阶段（多 Agent 团队正在持续推进）：**

- 补全剩余 Figma 屏幕（验证码优化、定位权限真实调用、收藏、添加地点、完整扫码加卡、取车时间选择器等）
- 地图上的司机实时追踪与动态 ETA
- 底部弹层 + 手势导航完善
- 完整离线支持 + 视觉回归测试
- 更多表单细节（国家选择器、数字键盘、OTP 输入体验）
- 可访问性、无障碍、完整 Playwright 视觉与流程测试

---

## 技术栈（2026 年研究验证版）

- **Vite 6 + React 19**（支持 Compiler）+ TypeScript（最严格配置）
- **Tailwind CSS v4**（通过 Vite 插件实现 CSS-first，设计令牌存放于 `@theme`）
- **React Router v7** + Framer Motion 负责路由与过渡
- **Zustand 5**（支持 persist）管理预订与用户状态
- **React Hook Form + Zod** 处理所有表单
- **MapLibre GL**（交互式地图）+ lucide-react 图标
- **vite-plugin-pwa** + Workbox
- **Biome**（格式化 +  lint）、Vitest + Playwright（测试）
- 完整支持 PWA 安装与离线壳

详细的 2026 架构研究记录在 Agent 日志中。

---

## 开始使用

```bash
# 1. 安装依赖（首次）
npm install

# 2. 启动开发服务器（支持热更新）
npm run dev

# 3. 打开 http://localhost:5173
#    你会看到精确的 iPhone 设备框架，里面就是 CARGO 应用。
#    可以完整走一遍从注册到下单的全部流程。

# 构建生产版本
npm run build

# 类型检查 + 代码检查
npm run typecheck
npm run lint

# 运行测试（逐步完善中）
npm test
npm run test:e2e
```

**推荐的测试方式**：

- 桌面端：使用精美的设备框架查看（最能体现 1:1 保真度）
- 真实移动端：在 iOS Safari 或 Chrome DevTools 设备模拟器（iPhone 14/15 Pro）中打开
- PWA：在 Chrome/Edge 桌面或真实设备上点击「安装」提示，或通过「分享 → 添加到主屏幕」

---

## Figma 参考素材

所有截图均存放在 `figma-refs/screens/` 和 `figma-refs/components/` 目录下，通过 MCP 桥接直接从在线 Figma 文件以 2× 比例导出。

这些素材可用于开发过程中的像素级比对。

---

## 项目结构

```
src/
  screens/           # 每个主要 Figma 屏幕/流程对应一个文件
  components/        # 共享 UI 组件（会随设计系统持续扩展）
  stores/            # Zustand 状态管理（预订流程的唯一事实来源）
  lib/               # 工具函数、未来 API 客户端、令牌导出
public/              # PWA 图标、静态资源
figma-refs/          # 设计参考截图 + 未来令牌 JSON
```

---

## 提交规范

本项目**严格遵循 Conventional Commits 1.0.0 规范**。

详情请查看 [CONVENTIONAL_COMMITS.md](./CONVENTIONAL_COMMITS.md)，其中包含：

- 至今所有工作的完整、规范的提交历史
- 本地回放历史时应使用的精确提交信息
- 未来的贡献规则

所有新提交必须使用以下格式：

```
<类型>[可选范围]: <描述>

[可选正文]

[可选脚注]
```

示例：
- `feat(map): add draggable destination pin with reverse geocoding`
- `fix(auth): prevent OTP input from losing focus on mobile`
- `chore: update dependencies to latest 2026 versions`
- `feat!: drop support for legacy booking format`（需包含 BREAKING CHANGE 脚注）

---

## 贡献与说明

本项目由多 Agent 软件工程团队（Grok + 多个专业子 Agent）自主构建。

- 所有变更均为直接代码修改 + 自我验证
- 引入新技术前均会先查阅官方文档与近期研究
- 每个阶段都会以可运行、可测试、已提交的功能结束
- **所有提交必须遵循 Conventional Commits 规范**（未来可能通过 commitlint + husky 强制执行）

当前团队正在继续推进：
- 从 Figma 提取剩余设计令牌与完整组件清单
- 完善 MapLibre 目的地选择器
- 补全剩余屏幕（验证码、定位权限、收藏、扫码加卡等）
- 增加 Playwright E2E 测试与视觉回归套件

---

## 许可证与致谢

本项目为教育 / 作品集目的，对内部设计系统进行复刻。

Figma 原始文件：「CARGO - Car Booking & Sharing App」（组件总览页 + 全部 20+ 个流程）。

为极致保真与匠心而构建 ❤️

---

## 地图实现说明（目的地选择器）

`/destination` 页面的交互式目的地选择器目前由 **MapLibre GL JS v5** 驱动（直接使用，无 React 封装）。

**瓦片来源（免费、无需密钥）：**
- 主瓦片：`https://tiles.openfreemap.org/styles/liberty/style.json`（OpenFreeMap，高品质 OSM 矢量瓦片）
- 优雅降级：MapLibre 演示瓦片

**地理编码（同样免费）：**
- 反向地理编码：Nominatim（`nominatim.openstreetmap.org`），使用礼貌的 User-Agent + 强力防抖 + AbortController
- 自动补全：Photon by Komoot（`photon.komoot.io`）

**如何更换服务商（面向未来）：**
1. 修改 `src/components/maps/MapView.tsx` 中的 `MAP_STYLE_PRIMARY` 常量
2. 更新 `src/components/maps/geocode.ts` 中的 `reverseGeocode` / `searchPlaces`（签名保持一致）
3. 实现完全离线：集成 PMTiles + `@maplibre/maplibre-gl-pmtiles`（详细说明见 MapView.tsx 内的注释）。组件对外 API 保持不变。

**打包策略**：`maplibre-gl` 被隔离在 Vite 配置的 `map-vendor` 手动分块中，MapView 本身通过 `React.lazy` 懒加载。

所有地图相关请求都具备生产级容错能力（失败时回退到坐标字符串、旧金山默认位置、若 OSRM 不可用则绘制直线）。

归属信息始终渲染（法律要求）。

---

## English Version

# CARGO — High-Fidelity Figma Replica (Full Suite)

**Pixel-perfect, fully interactive web replica of the "CARGO - Car Booking & Sharing App" design system** from the connected Figma file.

Built as a modern, production-grade PWA using the 2026 best-practice stack (React 19 + Vite + Tailwind v4 + Framer Motion + MapLibre + Zustand + RHF+Zod).

> Goal: 1:1 visual + interaction fidelity with every screen, component, flow, and detail present in the Figma — implemented as a real, usable application.

## Current Status (Phase 1 Complete)

- ✅ Full iPhone X device frame viewer
- ✅ Complete auth & onboarding flow
- ✅ Core booking engine with interactive MapLibre destination picker
- ✅ Global state, PWA support, design tokens aligned to Figma
- ✅ 15+ high-res Figma reference screenshots

(Full English details are preserved in the commit history and agent logs.)

## Tech Stack

Same as the Chinese section above.

## Getting Started

Same commands as above.

## Commit Convention

This project strictly follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/).

See [CONVENTIONAL_COMMITS.md](./CONVENTIONAL_COMMITS.md) for the full history and rules.

## License & Credits

Replica for educational/portfolio purposes.  
Figma file: "CARGO - Car Booking & Sharing App".

Built with ❤️ for fidelity and craft.

---

## 部署

本项目仅使用 GitHub Pages 部署（已配置好 `deploy.yml`）。

- 推送到 `main` 分支后会自动部署到 GitHub Pages（路径 `/figma-008/`）。
- 无需配置任何 Secrets。

---

## English

## Deployment

This project only uses GitHub Pages deployment (configured via `deploy.yml`).

- Pushing to `main` automatically deploys to GitHub Pages (under subpath `/figma-008/`).
- No secrets or additional configuration required.