// ==UserScript==
// @name         GitHub 返回顶部按钮
// @name:en      GitHub Back-to-Top Button
// @namespace    https://github.com/zyxn/github-to-top
// @version      1.1.0
// @description  在 GitHub 页面右下角添加一个图标按钮，点击后以「前快后慢」自定义动画滚动返回顶部；滚动超过半屏才显示。
// @description:en Adds a back-to-top icon button at the bottom-right of GitHub pages. Click for a custom ease-out (fast-then-slow) scroll animation back to top. Only visible after scrolling past half a viewport.
// @author       zyxn
// @match        *://github.com/*
// @icon         https://github.githubassets.com/favicons/favicon.svg
// @grant        GM_addStyle
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    /* ---------- 样式 ---------- */
    const CSS = `
        .ghtt-btn {
            position: fixed;
            right: 28px;
            bottom: 28px;
            z-index: 2147483646;
            width: 44px;
            height: 44px;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--ghtt-bg, rgba(31, 35, 40, 0.55));
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
            opacity: 0;
            visibility: hidden;
            transform: translateY(12px) scale(0.85);
            transition: opacity 0.25s ease, transform 0.25s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        .ghtt-btn--visible {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
        }
        .ghtt-btn:hover {
            background: var(--ghtt-bg-hover, rgba(31, 35, 40, 0.85));
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
            transform: translateY(-2px) scale(1.05);
        }
        .ghtt-btn:active {
            transform: translateY(0) scale(0.96);
        }
        .ghtt-btn:focus-visible {
            outline: 2px solid var(--ghtt-outline, #2f81f7);
            outline-offset: 2px;
        }
        /* 深色主题适配（GitHub 暗色模式下 html[data-color-mode] / html[data-dark]） */
        html[data-color-mode="dark"] .ghtt-btn {
            --ghtt-bg: rgba(201, 209, 217, 0.18);
            --ghtt-bg-hover: rgba(201, 209, 217, 0.32);
        }
        .ghtt-btn svg {
            width: 22px;
            height: 22px;
            fill: var(--ghtt-fg, #ffffff);
            transition: transform 0.2s ease;
        }
        html[data-color-mode="dark"] .ghtt-btn svg {
            --ghtt-fg: #e6edf3;
        }
        @media (prefers-reduced-motion: reduce) {
            .ghtt-btn { transition: none; }
        }
    `;

    /* ---------- 向上箭头 SVG ---------- */
    const ARROW_SVG = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 4.5l7 7-1.4 1.4L13 8.7V20h-2V8.7l-4.6 4.2L5 11.5l7-7z"/>
        </svg>`;

    /* ---------- 查找真正的滚动容器 ----------
       GitHub 多数页面直接滚动 window；但 SPA/pjax 切换后
       偶尔出现内层滚动容器。优先 window，回退到首屏可见滚动元素。
    */
    function getScrollTarget() {
        return window;
    }

    function getCurrentScroll() {
        return window.pageYOffset
            || document.documentElement.scrollTop
            || document.body.scrollTop
            || 0;
    }

    /* 当前滚动动画的 RAF 句柄，用于打断重入 */
    let activeFrame = null;

    function cancelActiveScroll() {
        if (activeFrame !== null) {
            cancelAnimationFrame(activeFrame);
            activeFrame = null;
        }
    }

    function smoothScrollToTop() {
        cancelActiveScroll();

        const startPos = getCurrentScroll();
        if (startPos <= 0) return; // 已在顶部，无需滚动

        // 尊重用户系统偏好：禁用动画时直接到顶
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            window.scrollTo(0, 0);
            return;
        }

        // 动画时长随距离自适应：250ms 起、每像素 +0.15ms，最长 600ms
        // 距离越远滚得越久，但不会拖沓
        const duration = Math.min(600, 250 + startPos * 0.15);
        const startTime = (typeof performance !== 'undefined'
            ? performance.now()
            : Date.now());

        // ease-out cubic：前快后慢，初段迅速上冲、末段缓慢收敛
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        function step(now) {
            const elapsed = now - startTime;
            const progress = elapsed >= duration ? 1 : easeOutCubic(elapsed / duration);
            // 剩余距离 = 起始位置 ×(1 - 进度)，配合 ease-out 实现「先快后慢」
            const remaining = startPos * (1 - progress);
            window.scrollTo(0, Math.round(remaining));
            if (progress < 1) {
                activeFrame = requestAnimationFrame(step);
            } else {
                activeFrame = null;
            }
        }

        activeFrame = requestAnimationFrame(step);
    }

    /* ---------- 创建按钮 ---------- */
    if (typeof GM_addStyle === 'function') {
        GM_addStyle(CSS);
    } else {
        const style = document.createElement('style');
        style.textContent = CSS;
        (document.head || document.documentElement).appendChild(style);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ghtt-btn';
    btn.title = '返回顶部';
    btn.setAttribute('aria-label', '返回顶部');
    btn.innerHTML = ARROW_SVG;
    btn.addEventListener('click', smoothScrollToTop);

    // 按钮挂到 body；如 body 尚未就绪则先挂到 html，再迁移
    (document.body || document.documentElement).appendChild(btn);
    if (!document.body) {
        document.addEventListener('DOMContentLoaded', () => {
            if (btn.parentElement !== document.body) {
                document.body.appendChild(btn);
            }
        });
    }

    /* ---------- 显隐控制 ---------- */
    let ticking = false;
    const VIEWPORT_THRESHOLD = Math.max(window.innerHeight * 0.5, 300); // 滚动超过半屏（至少 300px）才显示

    function updateVisibility() {
        const scrolled = getCurrentScroll();
        if (scrolled > VIEWPORT_THRESHOLD) {
            btn.classList.add('ghtt-btn--visible');
        } else {
            btn.classList.remove('ghtt-btn--visible');
        }
        ticking = false;
    }

    function onScroll() {
        if (!ticking) {
            ticking = true;
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(updateVisibility);
            } else {
                updateVisibility();
            }
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // 用户手动滚动（滚轮 / 触屏）时打断进行中的回顶动画，避免抢屏
    ['wheel', 'touchmove'].forEach((ev) => {
        window.addEventListener(ev, cancelActiveScroll, { passive: true });
    });
    updateVisibility();

    /* ---------- 兼容 GitHub pjax / turbo 导航 ----------
       GitHub 切换页面时可能清空 DOM，确保按钮仍在。
    */
    const REINSERT_EVENTS = ['pjax:end', 'turbo:load', 'soft-nav:end'];
    REINSERT_EVENTS.forEach((ev) => {
        document.addEventListener(ev, () => {
            if (!document.contains(btn)) {
                (document.body || document.documentElement).appendChild(btn);
            }
            updateVisibility();
        });
    });
})();
