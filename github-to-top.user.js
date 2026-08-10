// ==UserScript==
// @name         GitHub 返回顶部按钮
// @name:en      GitHub Back-to-Top Button
// @namespace    https://github.com/zyxn/github-to-top
// @version      1.0.0
// @description  在 GitHub 页面右下角添加一个图标按钮，点击后平滑滚动返回顶部；滚动超过一屏才显示。
// @description:en Adds a back-to-top icon button at the bottom-right of GitHub pages. Click to smoothly scroll to top. Only visible after scrolling past one viewport.
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

    function smoothScrollToTop() {
        // 优先用原生 smooth（尊重用户系统设置）
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
        // 兜底：某些情况下 scrollTo 不生效
        const start = getCurrentScroll();
        if (start > 0 && getCurrentScroll() === start && document.documentElement) {
            document.documentElement.scrollTop = 0;
        }
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
