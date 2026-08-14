/**
 * Switch Live JS — Ultra-Fast, Zero-Dependency SPA & Partial Navigation Engine.
 *
 * (c) celionatti — Switch Framework
 */
(function (window, document) {
    'use strict';

    if (window.SwitchLive) return;

    var SwitchLive = {
        options: {
            defaultTarget: '[switch-live-root], #app, main, body',
            timeout: 10000,
            activeClass: 'switch-loading'
        },

        init: function () {
            document.addEventListener('click', this.handleClick.bind(this), false);
            document.addEventListener('submit', this.handleSubmit.bind(this), false);
            window.addEventListener('popstate', this.handlePopState.bind(this), false);
        },

        isLiveElement: function (el) {
            if (!el) return false;
            return el.hasAttribute('switch-to') ||
                   el.hasAttribute('switch-live') ||
                   el.closest('[switch-live-root]') !== null;
        },

        getTargetSelector: function (el) {
            if (el && el.getAttribute('switch-target')) {
                return el.getAttribute('switch-target');
            }
            var container = el ? el.closest('[switch-target]') : null;
            if (container) {
                return container.getAttribute('switch-target');
            }
            return this.options.defaultTarget;
        },

        handleClick: function (e) {
            var anchor = e.target.closest('a');
            if (!anchor) return;

            if (!this.isLiveElement(anchor)) return;

            var href = anchor.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

            // Don't intercept external links or modified clicks (ctrl/cmd click)
            if (anchor.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

            e.preventDefault();
            var targetSel = this.getTargetSelector(anchor);
            this.navigate(href, { method: 'GET', target: targetSel, pushState: true });
        },

        handleSubmit: function (e) {
            var form = e.target;
            if (!form || !this.isLiveElement(form)) return;

            e.preventDefault();

            var action = form.getAttribute('action') || window.location.href;
            var method = (form.getAttribute('method') || 'GET').toUpperCase();
            var targetSel = this.getTargetSelector(form);
            var formData = new FormData(form);

            this.navigate(action, {
                method: method,
                body: method === 'GET' ? null : formData,
                target: targetSel,
                pushState: true
            });
        },

        handlePopState: function (e) {
            if (e.state && e.state.switchLive) {
                this.navigate(window.location.href, {
                    method: 'GET',
                    target: e.state.target || this.options.defaultTarget,
                    pushState: false
                });
            } else {
                this.navigate(window.location.href, {
                    method: 'GET',
                    target: this.options.defaultTarget,
                    pushState: false
                });
            }
        },

        navigate: function (url, opts) {
            opts = opts || {};
            var method = opts.method || 'GET';
            var targetSel = opts.target || this.options.defaultTarget;

            this.dispatchEvent('switch:live:start', { url: url, options: opts });

            var headers = {
                'X-Switch-Live': '1',
                'X-Requested-With': 'XMLHttpRequest'
            };

            var fetchOpts = {
                method: method,
                headers: headers
            };

            if (opts.body) {
                fetchOpts.body = opts.body;
            }

            var self = this;
            document.body.classList.add(this.options.activeClass);

            fetch(url, fetchOpts)
                .then(function (res) {
                    var titleHeader = res.headers.get('X-Switch-Title');
                    var targetHeader = res.headers.get('X-Switch-Target');
                    if (targetHeader) targetSel = targetHeader;

                    return res.text().then(function (html) {
                        return { ok: res.ok, status: res.status, html: html, title: titleHeader, url: res.url || url };
                    });
                })
                .then(function (data) {
                    document.body.classList.remove(self.options.activeClass);

                    if (data.ok) {
                        self.updateDOM(data.html, targetSel, data.title);

                        if (opts.pushState !== false) {
                            window.history.pushState({ switchLive: true, target: targetSel }, '', data.url);
                        }

                        self.dispatchEvent('switch:live:success', { url: data.url, html: data.html });
                    } else {
                        self.dispatchEvent('switch:live:error', { status: data.status, html: data.html });
                    }

                    self.dispatchEvent('switch:live:finish', { url: data.url });
                })
                .catch(function (err) {
                    document.body.classList.remove(self.options.activeClass);
                    self.dispatchEvent('switch:live:error', { error: err });
                    self.dispatchEvent('switch:live:finish', { url: url });
                });
        },

        updateDOM: function (html, targetSel, customTitle) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');

            // 1. Update Title
            if (customTitle) {
                document.title = customTitle;
            } else if (doc.title) {
                document.title = doc.title;
            }

            // 2. Find target container
            var targetEl = document.querySelector(targetSel);
            var sourceEl = doc.querySelector(targetSel);

            if (targetEl && sourceEl) {
                targetEl.innerHTML = sourceEl.innerHTML;
            } else if (targetEl && !sourceEl) {
                // If response is raw partial HTML
                targetEl.innerHTML = html;
            } else {
                // Fallback: replace body content
                if (doc.body && document.body) {
                    document.body.innerHTML = doc.body.innerHTML;
                }
            }

            // 3. Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        dispatchEvent: function (name, detail) {
            var event = new CustomEvent(name, { detail: detail, bubbles: true, cancelable: true });
            document.dispatchEvent(event);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            SwitchLive.init();
        });
    } else {
        SwitchLive.init();
    }

    window.SwitchLive = SwitchLive;
})(window, document);
