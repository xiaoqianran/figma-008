# CARGO — 高保真 Figma 复刻（完整套件）

<!-- 
  GitHub 状态徽章（把 OWNER/REPO 替换成你的仓库路径，例如 yuminghui/cargo-figma-replica）
  替换后即可在 GitHub 首页和 README 看到实时的 CI / 部署状态
-->
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
[![Deploy (GitHub Pages)](https://github.com/OWNER/REPO/actions/workflows/deploy.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/deploy.yml)
[![Deploy (Remote)](https://github.com/OWNER/REPO/actions/workflows/deploy-remote.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/deploy-remote.yml)

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

## 持续集成 CI（GitHub Actions）

每次 push / PR 都会自动运行完整 CI 检查，结果会直接显示在 GitHub 的 commit 列表和 Pull Request 页面上（绿色 ✓ / 红色 ✗）。

### 包含的检查项

| 检查项           | 命令                     | 说明                              |
|------------------|--------------------------|-----------------------------------|
| Lint + Format    | `biome ci .`             | 代码规范 + 格式化检查             |
| TypeScript       | `tsc --noEmit`           | 严格类型检查                      |
| Build            | `npm run build`          | 生产构建验证                      |
| Unit Tests       | `vitest run`             | 单元测试                          |
| E2E Tests        | `playwright test`        | 端到端流程测试（完整预订流程）    |

### 工作流文件

- `.github/workflows/ci.yml` — 主 CI（推荐在 PR 中开启 Required Status Checks）

---

## 远程自部署（GitHub Actions）

本项目已提供开箱即用的远程服务器部署工作流（区别于 GitHub Pages）。

### 快速配置

1. 在仓库设置中把 **GitHub Pages → Source** 改为 **GitHub Actions**（你已经做完了 👍）

2. 新建以下 **Secrets**（路径：Settings → Secrets and variables → Actions → New repository secret）：

   | Secret 名称          | 说明                                   | 示例                     |
   |----------------------|----------------------------------------|--------------------------|
   | `DEPLOY_HOST`        | 服务器 IP 或域名                       | `123.45.67.89`           |
   | `SSH_PRIVATE_KEY`    | SSH 私钥完整内容                       | `-----BEGIN OPENSSH...`  |
   | `DEPLOY_USER`        | SSH 用户名（可选，默认 root）          | `root` / `ubuntu`        |
   | `DEPLOY_PATH`        | 远程网站根目录（可选）                 | `/var/www/cargo`         |
   | `DEPLOY_PORT`        | SSH 端口（可选，默认 22）              | `22`                     |
   | `RELOAD_NGINX`       | 部署后是否重载 Nginx（可选）           | `true`                   |

3. 在远程服务器配置 Nginx（关键！必须支持 SPA 路由）：

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       root /var/www/cargo;        # 对应 DEPLOY_PATH
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # 静态资源长期缓存
       location /assets {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

4. 推送到 `main` 分支或手动触发 **Actions → "Deploy to Remote Server (自部署)"** 即可自动部署。

### 已有工作流说明

- `.github/workflows/deploy.yml` → GitHub Pages（子路径 `/figma-008/`）
- `.github/workflows/deploy-remote.yml` → 你的远程服务器（根路径 `/`）

两个工作流可同时存在，互不影响。

---

## English

## Continuous Integration (GitHub Actions)

Every push and pull request automatically runs the full CI pipeline. Results appear directly on commits and PRs as green checkmarks (✓) or red crosses (✗).

### Checks Included

| Check            | Command                  | Description                              |
|------------------|--------------------------|------------------------------------------|
| Lint + Format    | `biome ci .`             | Code style + formatting enforcement      |
| TypeScript       | `tsc --noEmit`           | Strict type checking                     |
| Build            | `npm run build`          | Production build verification            |
| Unit Tests       | `vitest run`             | Unit tests                               |
| E2E Tests        | `playwright test`        | Full booking flow end-to-end tests       |

### Workflow Files

- `.github/workflows/ci.yml` — Main CI (recommended to set as Required Status Check on PRs)

---

## Remote Self-Deployment (GitHub Actions)

A dedicated workflow for deploying to your own VPS is included.

### Quick Setup

1. Set GitHub Pages source to **GitHub Actions** in repo settings (already done).

2. Configure these **Repository Secrets**:

   - `DEPLOY_HOST` — Server IP/domain
   - `SSH_PRIVATE_KEY` — Full SSH private key
   - `DEPLOY_PATH` — e.g. `/var/www/cargo` (optional)
   - `DEPLOY_USER`, `DEPLOY_PORT`, `RELOAD_NGINX` (optional)

3. On your server, make sure Nginx has SPA fallback:

   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

4. Push to `main` or manually run the "Deploy to Remote Server (自部署)" workflow.

Two workflows coexist peacefully:
- `deploy.yml` → GitHub Pages
- `deploy-remote.yml` → Your own server (recommended for production)