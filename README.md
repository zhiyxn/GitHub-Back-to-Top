# GitHub 返回顶部按钮 (GitHub Back-to-Top)

一个 **油猴脚本 (UserScript)**，在 GitHub 页面右下角添加一个图标按钮，点击后平滑滚动返回顶部。滚动超过半屏才显示，离开顶部时淡入、回到顶部时淡出。

![license](https://img.shields.io/badge/license-MIT-blue) ![userscript](https://img.shields.io/badge/type-UserScript-3b82f6)

## 特性

- 🎯 **右下角悬浮按钮**：44px 圆形，毛玻璃背景，自适应 GitHub 浅色/深色主题
- ⬆️ **平滑滚动回顶部**：`requestAnimationFrame` 自定义「前快后慢」ease-out 缓动，时长按距离自适应；自动尊重 `prefers-reduced-motion`
- 👀 **智能显隐**：滚动超过半屏（最少 300px）才出现，带淡入 + 上移过渡动画
- ♿ **无障碍**：带 `aria-label`、`title`、键盘聚焦轮廓
- ⚡ **性能友好**：滚动用 `requestAnimationFrame` 节流
- 🔄 **兼容 pjax/turbo/soft-nav**：GitHub SPA 切换页面后按钮自动重建
- 📦 **零依赖**：纯原生 CSS + JS

## 安装

### 1. 安装用户脚本管理器

在浏览器中安装以下任一扩展：

- [Tampermonkey](https://www.tampermonkey.net/)（Chrome / Edge / Firefox / Safari）
- [Violentmonkey](https://violentmonkey.github.io/)（Chrome / Edge / Firefox）
- [Greasemonkey](https://www.greasespot.net/)（Firefox，仅支持较旧语法）

### 2. 安装脚本

- **方式一**：打开 [`github-to-top.user.js`](./github-to-top.user.js) 的原始内容，脚本管理器会自动弹出安装提示：
  ```
  https://raw.githubusercontent.com/<你的用户名>/github-to-top/main/github-to-top.user.js
  ```
- **方式二**：手动复制脚本文件内容，在管理器中「新建脚本」并粘贴保存。

### 3. 打开任意 GitHub 页面

在仓库主页、Issue、PR、个人主页等任意可滚动页面，向下滚动即可看到右下角的箭头按钮。

## 配置

打开脚本源码，顶部 CSS 区块可调整：

| 变量 / 选择器 | 作用 | 默认值 |
|---------------|------|--------|
| `.ghtt-btn` `right` / `bottom` | 按钮距右下角的距离 | `28px` |
| `.ghtt-btn` `width` / `height` | 按钮尺寸 | `44px` |
| `VIEWPORT_THRESHOLD` (JS) | 出现按钮的滚动阈值 | 半屏高度，最少 300px |

## 兼容性

- ✅ GitHub 仓库主页 / Issues / Pull Requests / Wiki / 用户主页 / 搜索结果
- ✅ 浅色与深色主题（`prefers-color-scheme` 及 GitHub 自带 `data-color-mode="dark"`）
- ✅ pjax / turbo / soft-nav SPA 导航后按钮自动重建

已知限制：GitHub 部分内嵌滚动容器（如代码侧边面板）的独立滚动内容由全局按钮处理；如个别场景不触发，欢迎提 issue。

## 许可证

MIT
