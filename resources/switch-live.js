/**
 * Switch Live JS — Ultra-Fast, Zero-Dependency SPA, DOM Morphing, Polling, Lazy, Infinite Scroll & Event Engine.
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
            activeClass: 'switch-loading',
            progressBar: true
        },

        prefetchCache: {},
        debounceTimers: {},
        activePolls: [],
        observers: [],
        dragState: { el: null, sourceContainer: null, sourceIndex: -1, id: null, sourceGroup: null },

        init: function () {
            this.injectStyles();
            this.setupProgressBar();
            this.setupToastContainer();

            document.addEventListener('click', this.handleClick.bind(this), false);
            document.addEventListener('submit', this.handleSubmit.bind(this), false);
            document.addEventListener('input', this.handleInput.bind(this), false);
            document.addEventListener('change', this.handleChange.bind(this), false);
            document.addEventListener('mouseover', this.handleMouseOver.bind(this), false);
            document.addEventListener('dragstart', this.handleDragStart.bind(this), false);
            document.addEventListener('dragover', this.handleDragOver.bind(this), false);
            document.addEventListener('dragleave', this.handleDragLeave.bind(this), false);
            document.addEventListener('drop', this.handleDrop.bind(this), false);
            document.addEventListener('dragend', this.handleDragEnd.bind(this), false);
            window.addEventListener('popstate', this.handlePopState.bind(this), false);

            this.scanDynamicDirectives();

            // Observe DOM mutations to auto-scan dynamically added components
            var mutationObserver = new MutationObserver(this.debounce(this.scanDynamicDirectives.bind(this), 100));
            mutationObserver.observe(document.body, { childList: true, subtree: true });

            // Handle visibility change for polling
            document.addEventListener('visibilitychange', function () {
                if (document.hidden) {
                    SwitchLive.pausePolling();
                } else {
                    SwitchLive.resumePolling();
                }
            });
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
            var trigger = e.target.closest('a, button[switch-to], button[switch-action], [switch-click]');
            if (!trigger) return;

            var isAnchor = trigger.tagName === 'A';
            if (isAnchor && !this.isLiveElement(trigger)) return;

            var href = trigger.getAttribute('href') || trigger.getAttribute('switch-action') || trigger.getAttribute('switch-to') || trigger.getAttribute('switch-click');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

            // Don't intercept external links or modified clicks (ctrl/cmd click)
            if (trigger.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

            // Confirmation check
            var confirmMsg = trigger.getAttribute('switch-confirm');
            if (confirmMsg && !window.confirm(confirmMsg)) {
                e.preventDefault();
                return;
            }

            e.preventDefault();
            var targetSel = this.getTargetSelector(trigger);
            var preserveScroll = trigger.hasAttribute('switch-preserve-scroll') || !isAnchor;
            var transition = trigger.getAttribute('switch-transition');
            var method = (trigger.getAttribute('switch-method') || (trigger.hasAttribute('switch-action') ? 'POST' : 'GET')).toUpperCase();

            var pushUrl = trigger.hasAttribute('switch-push-url') ? (trigger.getAttribute('switch-push-url') !== 'false') : isAnchor;

            var body = null;
            var rawData = trigger.getAttribute('switch-data');
            if (rawData) {
                try {
                    var parsed = JSON.parse(rawData);
                    var formData = new FormData();
                    for (var k in parsed) {
                        formData.append(k, parsed[k]);
                    }
                    body = formData;
                } catch (err) {
                    body = rawData;
                }
            }

            this.navigate(href, {
                method: method,
                body: body,
                target: targetSel,
                pushState: pushUrl,
                triggerElement: trigger,
                preserveScroll: preserveScroll,
                transition: transition
            });
        },

        handleSubmit: function (e) {
            var form = e.target;
            if (!form || !this.isLiveElement(form)) return;

            // Confirmation check
            var confirmMsg = form.getAttribute('switch-confirm');
            if (confirmMsg && !window.confirm(confirmMsg)) {
                e.preventDefault();
                return;
            }

            e.preventDefault();

            var action = form.getAttribute('action') || window.location.href;
            var method = (form.getAttribute('method') || 'GET').toUpperCase();
            var targetSel = this.getTargetSelector(form);
            var formData = new FormData(form);
            var preserveScroll = form.hasAttribute('switch-preserve-scroll');
            var transition = form.getAttribute('switch-transition');

            this.navigate(action, {
                method: method,
                body: method === 'GET' ? null : formData,
                target: targetSel,
                pushState: true,
                triggerElement: form,
                preserveScroll: preserveScroll,
                transition: transition
            });
        },

        handleInput: function (e) {
            var input = e.target;
            if (!input.hasAttribute('switch-search') && !input.hasAttribute('switch-input')) return;

            var url = input.getAttribute('switch-search') || input.getAttribute('switch-input') || window.location.href;
            var debounceMs = parseInt(input.getAttribute('switch-debounce') || '300', 10);
            var targetSel = this.getTargetSelector(input);
            var name = input.getAttribute('name') || 'q';
            var val = input.value;

            clearTimeout(this.debounceTimers[input]);
            this.debounceTimers[input] = setTimeout(function () {
                var reqUrl = new URL(url, window.location.origin);
                reqUrl.searchParams.set(name, val);

                SwitchLive.navigate(reqUrl.toString(), {
                    method: 'GET',
                    target: targetSel,
                    pushState: input.hasAttribute('switch-push-url'),
                    triggerElement: input,
                    preserveScroll: true
                });
            }, debounceMs);
        },

        handleChange: function (e) {
            var el = e.target;
            if (el.hasAttribute('switch-upload') && el.type === 'file') {
                this.handleFileUpload(el);
                return;
            }

            if (!el.hasAttribute('switch-change')) return;

            var url = el.getAttribute('switch-change') || window.location.href;
            var targetSel = this.getTargetSelector(el);
            var name = el.getAttribute('name') || 'filter';
            var val = el.value;

            var reqUrl = new URL(url, window.location.origin);
            reqUrl.searchParams.set(name, val);

            this.navigate(reqUrl.toString(), {
                method: 'GET',
                target: targetSel,
                pushState: el.hasAttribute('switch-push-url'),
                triggerElement: el,
                preserveScroll: true
            });
        },

        handleFileUpload: function (input) {
            if (!input.files || input.files.length === 0) return;
            var file = input.files[0];

            // 1. Client-Side Image Preview
            var previewSel = input.getAttribute('switch-preview');
            if (previewSel) {
                var previewEl = document.querySelector(previewSel);
                if (previewEl) {
                    if (previewEl.tagName === 'IMG') {
                        previewEl.src = URL.createObjectURL(file);
                    } else {
                        previewEl.style.backgroundImage = 'url(' + URL.createObjectURL(file) + ')';
                    }
                }
            }

            // 2. Upload Endpoint & Form Data
            var uploadUrl = input.getAttribute('switch-upload');
            if (!uploadUrl || uploadUrl === 'true' || uploadUrl === '') {
                var form = input.closest('form');
                uploadUrl = form ? (form.getAttribute('action') || window.location.href) : window.location.href;
            }

            var targetSel = this.getTargetSelector(input);
            var formData = new FormData();
            formData.append(input.name || 'file', file);

            // Append additional form fields if inside a form
            var parentForm = input.closest('form');
            if (parentForm) {
                var otherInputs = parentForm.querySelectorAll('input:not([type="file"]), select, textarea');
                for (var i = 0; i < otherInputs.length; i++) {
                    if (otherInputs[i].name && otherInputs[i].value) {
                        formData.append(otherInputs[i].name, otherInputs[i].value);
                    }
                }
            }

            this.navigate(uploadUrl, {
                method: 'POST',
                body: formData,
                target: targetSel,
                triggerElement: input,
                preserveScroll: true
            });
        },

        handleDragStart: function (e) {
            var container = e.target.closest('[switch-sortable], [switch-sortable-group]');
            if (!container) return;

            var item = e.target.closest('[draggable="true"], [data-id], tr, li, .sortable-item, [switch-sortable-item]');
            if (!item || item === container || !container.contains(item)) return;

            var handle = container.getAttribute('switch-handle');
            if (handle && !e.target.closest(handle)) {
                e.preventDefault();
                return;
            }

            this.dragState = {
                el: item,
                sourceContainer: container,
                sourceIndex: Array.prototype.indexOf.call(container.children, item),
                id: item.dataset.id || item.getAttribute('data-id') || item.id || '',
                sourceGroup: container.getAttribute('switch-sortable-group') || container.getAttribute('data-group') || null
            };

            item.classList.add('switch-dragging');
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', this.dragState.id);
            }

            this.dispatchEvent('switch:sort:start', { item: item, container: container, id: this.dragState.id });
        },

        handleDragOver: function (e) {
            if (!this.dragState.el) return;

            var container = e.target.closest('[switch-sortable], [switch-sortable-group]');
            if (!container) return;

            var targetGroup = container.getAttribute('switch-sortable-group') || container.getAttribute('data-group') || null;
            if (this.dragState.sourceGroup && targetGroup && this.dragState.sourceGroup !== targetGroup) {
                return;
            }

            e.preventDefault();
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'move';
            }

            var targetItem = e.target.closest('[draggable="true"], [data-id], tr, li, .sortable-item, [switch-sortable-item]');
            if (targetItem && targetItem !== this.dragState.el && container.contains(targetItem)) {
                var rect = targetItem.getBoundingClientRect();
                var isVertical = rect.height >= rect.width;
                var offset = isVertical ? (e.clientY - rect.top) / rect.height : (e.clientX - rect.left) / rect.width;

                if (offset > 0.5) {
                    targetItem.after(this.dragState.el);
                } else {
                    targetItem.before(this.dragState.el);
                }
            } else if (!targetItem && container.children.length === 0) {
                container.appendChild(this.dragState.el);
            }

            container.classList.add('switch-drop-active');
        },

        handleDragLeave: function (e) {
            var container = e.target.closest('[switch-sortable], [switch-sortable-group]');
            if (container && !container.contains(e.relatedTarget)) {
                container.classList.remove('switch-drop-active');
            }
        },

        handleDrop: function (e) {
            if (!this.dragState.el) return;
            e.preventDefault();

            var container = e.target.closest('[switch-sortable], [switch-sortable-group]');
            if (!container) return;

            container.classList.remove('switch-drop-active');
            this.dragState.el.classList.remove('switch-dragging');

            var targetGroup = container.getAttribute('switch-sortable-group') || container.getAttribute('data-group') || null;
            var targetIndex = Array.prototype.indexOf.call(container.children, this.dragState.el);
            var isChanged = (container !== this.dragState.sourceContainer) || (targetIndex !== this.dragState.sourceIndex);

            if (isChanged) {
                var endpoint = container.getAttribute('switch-sortable') || container.getAttribute('switch-sortable-group') || container.getAttribute('switch-action') || window.location.href;

                var childNodes = container.querySelectorAll('[data-id], [switch-sortable-item]');
                var order = [];
                if (childNodes.length > 0) {
                    for (var i = 0; i < childNodes.length; i++) {
                        var cid = childNodes[i].dataset.id || childNodes[i].getAttribute('data-id') || childNodes[i].id;
                        if (cid) order.push(cid);
                    }
                } else {
                    for (var j = 0; j < container.children.length; j++) {
                        var elId = container.children[j].dataset.id || container.children[j].getAttribute('data-id') || container.children[j].id;
                        if (elId) order.push(elId);
                    }
                }

                var payload = {
                    id: this.dragState.id,
                    source_group: this.dragState.sourceGroup,
                    target_group: targetGroup,
                    ids: order,
                    order: order,
                    old_index: this.dragState.sourceIndex,
                    new_index: targetIndex
                };

                this.dispatchEvent('switch:sort:change', payload);

                var draggedEl = this.dragState.el;
                var srcContainer = this.dragState.sourceContainer;
                var srcIndex = this.dragState.sourceIndex;

                var debounceMs = parseInt(container.getAttribute('switch-debounce') || '250', 10);
                var timerKey = 'sortable_' + (targetGroup || 'default');
                clearTimeout(this.debounceTimers[timerKey]);
                this.debounceTimers[timerKey] = setTimeout(function () {
                    SwitchLive.syncSortOrder(endpoint, payload, draggedEl, srcContainer, srcIndex);
                }, debounceMs);
            }
        },

        handleDragEnd: function (e) {
            if (this.dragState.el) {
                this.dragState.el.classList.remove('switch-dragging');
            }
            document.querySelectorAll('.switch-drop-active').forEach(function (el) {
                el.classList.remove('switch-drop-active');
            });
            this.dispatchEvent('switch:sort:end', { item: this.dragState.el });
            this.dragState = { el: null, sourceContainer: null, sourceIndex: -1, id: null, sourceGroup: null };
        },

        syncSortOrder: function (endpoint, payload, itemEl, originalContainer, originalIndex) {
            var self = this;
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Switch-Live': '1',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(payload)
            }).then(function (res) {
                var toastHeader = res.headers.get('X-Switch-Toast');
                if (toastHeader) {
                    try {
                        var toastData = JSON.parse(toastHeader);
                        self.showToast(toastData.message, toastData.type);
                    } catch (e) {}
                }

                if (!res.ok) {
                    throw new Error('Server returned ' + res.status);
                }

                self.dispatchEvent('switch:sorted', payload);
            }).catch(function (err) {
                // Revert DOM position on failure
                if (originalContainer && itemEl) {
                    if (originalContainer.contains(itemEl) === false || originalContainer.children[originalIndex] !== itemEl) {
                        if (originalContainer.children[originalIndex]) {
                            originalContainer.insertBefore(itemEl, originalContainer.children[originalIndex]);
                        } else {
                            originalContainer.appendChild(itemEl);
                        }
                    }
                }

                self.showToast('Failed to update sort order. Changes reverted.', 'error');
                self.dispatchEvent('switch:sort:error', { error: err, payload: payload });
            });
        },

        handleMouseOver: function (e) {
            var anchor = e.target.closest('a');
            if (!anchor || !anchor.hasAttribute('switch-prefetch')) return;

            var href = anchor.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:') || this.prefetchCache[href]) return;

            this.prefetch(href);
        },

        prefetch: function (url) {
            var self = this;
            fetch(url, {
                method: 'GET',
                headers: { 'X-Switch-Live': '1', 'X-Requested-With': 'XMLHttpRequest', 'X-Switch-Prefetch': '1' }
            }).then(function (res) {
                if (res.ok) {
                    res.text().then(function (html) {
                        self.prefetchCache[url] = {
                            html: html,
                            title: res.headers.get('X-Switch-Title'),
                            target: res.headers.get('X-Switch-Target'),
                            time: Date.now()
                        };
                    });
                }
            }).catch(function () {});
        },

        handlePopState: function (e) {
            var state = e.state || {};
            this.navigate(window.location.href, {
                method: 'GET',
                target: state.target || this.options.defaultTarget,
                pushState: false,
                restoreScroll: state.scrollY || 0
            });
        },

        navigate: function (url, opts) {
            opts = opts || {};
            var method = opts.method || 'GET';
            var targetSel = opts.target || this.options.defaultTarget;
            var self = this;

            this.dispatchEvent('switch:live:start', { url: url, options: opts });
            this.showLoadingState(opts.triggerElement);
            this.startProgressBar();

            // Save scroll position for back navigation
            if (window.history.state) {
                var currentState = window.history.state;
                currentState.scrollY = window.scrollY;
                window.history.replaceState(currentState, '');
            }

            // Clear prefetch cache on mutations or when noCache is requested
            if (method !== 'GET' || opts.noCache) {
                this.prefetchCache = {};
            }

            // Check prefetch cache (valid for 30 seconds)
            if (method === 'GET' && !opts.noCache && this.prefetchCache[url] && (Date.now() - this.prefetchCache[url].time < 30000)) {
                var cached = this.prefetchCache[url];
                delete this.prefetchCache[url];
                this.applyResponse(cached.html, targetSel, cached.title, cached.target, url, opts);
                return;
            }

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

            document.body.classList.add(this.options.activeClass);

            fetch(url, fetchOpts)
                .then(function (res) {
                    var titleHeader = res.headers.get('X-Switch-Title');
                    var targetHeader = res.headers.get('X-Switch-Target');
                    var redirectHeader = res.headers.get('X-Switch-Redirect');
                    var toastHeader = res.headers.get('X-Switch-Toast');
                    var eventHeader = res.headers.get('X-Switch-Event');
                    var scrollHeader = res.headers.get('X-Switch-Scroll');

                    if (redirectHeader) {
                        self.prefetchCache = {};
                        self.navigate(redirectHeader, { method: 'GET', target: targetSel, pushState: true, noCache: true });
                        return null;
                    }

                    if (toastHeader) {
                        try {
                            var toastData = JSON.parse(toastHeader);
                            self.showToast(toastData.message, toastData.type);
                        } catch (e) {
                            self.showToast(toastHeader, 'info');
                        }
                    }

                    if (eventHeader) {
                        try {
                            var evData = JSON.parse(eventHeader);
                            self.dispatchEvent(evData.event, evData.detail || {});
                        } catch (e) {}
                    }

                    if (scrollHeader === 'preserve') {
                        opts.preserveScroll = true;
                    }

                    return res.text().then(function (html) {
                        return {
                            ok: res.ok,
                            status: res.status,
                            html: html,
                            title: titleHeader,
                            target: targetHeader,
                            url: res.url || url
                        };
                    });
                })
                .then(function (data) {
                    if (!data) return;
                    self.applyResponse(data.html, targetSel, data.title, data.target, data.url, opts);
                })
                .catch(function (err) {
                    self.hideLoadingState(opts.triggerElement);
                    self.finishProgressBar();
                    document.body.classList.remove(self.options.activeClass);
                    self.dispatchEvent('switch:live:error', { error: err, url: url });
                    self.dispatchEvent('switch:live:finish', { url: url });
                });
        },

        applyResponse: function (html, targetSel, customTitle, customTarget, finalUrl, opts) {
            var self = this;
            var resolvedTarget = customTarget || targetSel;

            this.hideLoadingState(opts.triggerElement);
            this.finishProgressBar();
            document.body.classList.remove(this.options.activeClass);

            var targetEl = document.querySelector(resolvedTarget);

            // Apply CSS page transitions if requested
            if (opts.transition && targetEl) {
                targetEl.classList.add('switch-transition-out', 'switch-transition-' + opts.transition);
                setTimeout(function () {
                    self.updateDOM(html, resolvedTarget, customTitle, opts);
                    targetEl.classList.remove('switch-transition-out');
                    targetEl.classList.add('switch-transition-in');
                    setTimeout(function () {
                        targetEl.classList.remove('switch-transition-in', 'switch-transition-' + opts.transition);
                    }, 250);
                }, 150);
            } else {
                this.updateDOM(html, resolvedTarget, customTitle, opts);
            }

            if (opts.pushState !== false) {
                window.history.pushState({ switchLive: true, target: resolvedTarget }, '', finalUrl);
            }

            if (typeof opts.restoreScroll === 'number') {
                window.scrollTo({ top: opts.restoreScroll, behavior: 'instant' });
            } else if (!opts.preserveScroll) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            this.dispatchEvent('switch:live:success', { url: finalUrl, html: html });
            this.dispatchEvent('switch:live:finish', { url: finalUrl });
            this.scanDynamicDirectives();
        },

        updateDOM: function (html, targetSel, customTitle, opts) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');

            // 1. Update Document Title
            if (customTitle) {
                document.title = customTitle;
            } else if (doc.title) {
                document.title = doc.title;
            }

            // 2. Find target element
            var targetEl = document.querySelector(targetSel);
            var sourceEl = doc.querySelector(targetSel);

            if (!targetEl) {
                if (doc.body && document.body) {
                    this.morphDOM(document.body, doc.body);
                }
                return;
            }

            var contentNode = sourceEl || (doc.body.children.length === 1 ? doc.body.firstElementChild : doc.body);

            if (opts.append) {
                while (contentNode.firstChild) {
                    targetEl.appendChild(contentNode.firstChild);
                }
            } else if (opts.prepend) {
                while (contentNode.lastChild) {
                    targetEl.insertBefore(contentNode.lastChild, targetEl.firstChild);
                }
            } else {
                this.morphDOM(targetEl, contentNode);
            }
        },

        /**
         * Ultra-fast lightweight DOM morphing algorithm that preserves input focus and state.
         */
        morphDOM: function (oldNode, newNode) {
            if (!oldNode || !newNode) return;

            // If tag names differ, replace entirely
            if (oldNode.nodeType !== newNode.nodeType || oldNode.nodeName !== newNode.nodeName) {
                oldNode.parentNode.replaceChild(newNode.cloneNode(true), oldNode);
                return;
            }

            // Text node update
            if (oldNode.nodeType === Node.TEXT_NODE) {
                if (oldNode.textContent !== newNode.textContent) {
                    oldNode.textContent = newNode.textContent;
                }
                return;
            }

            // Comment node update
            if (oldNode.nodeType === Node.COMMENT_NODE) {
                if (oldNode.nodeValue !== newNode.nodeValue) {
                    oldNode.nodeValue = newNode.nodeValue;
                }
                return;
            }

            // Only process attributes and element properties on ELEMENT_NODE (1)
            if (oldNode.nodeType !== Node.ELEMENT_NODE) {
                return;
            }

            // Sync attributes
            var oldAttrs = oldNode.attributes || [];
            var newAttrs = newNode.attributes || [];

            for (var i = newAttrs.length - 1; i >= 0; i--) {
                var attr = newAttrs[i];
                if (oldNode.getAttribute(attr.name) !== attr.value) {
                    oldNode.setAttribute(attr.name, attr.value);
                }
            }

            for (var j = oldAttrs.length - 1; j >= 0; j--) {
                var oldAttr = oldAttrs[j];
                if (!newNode.hasAttribute(oldAttr.name)) {
                    oldNode.removeAttribute(oldAttr.name);
                }
            }

            // Preserve input / textarea values and states
            if (oldNode.nodeName === 'INPUT' || oldNode.nodeName === 'TEXTAREA') {
                if (oldNode.value !== newNode.value && document.activeElement !== oldNode) {
                    oldNode.value = newNode.value;
                }
                if (oldNode.type === 'checkbox' || oldNode.type === 'radio') {
                    oldNode.checked = newNode.checked;
                }
                return;
            }

            if (oldNode.nodeName === 'SELECT') {
                if (oldNode.value !== newNode.value && document.activeElement !== oldNode) {
                    oldNode.value = newNode.value;
                }
                return;
            }

            // Morph children
            var oldChildren = Array.prototype.slice.call(oldNode.childNodes);
            var newChildren = Array.prototype.slice.call(newNode.childNodes);

            var oldLen = oldChildren.length;
            var newLen = newChildren.length;
            var maxLen = Math.max(oldLen, newLen);

            for (var k = 0; k < maxLen; k++) {
                if (k >= oldLen) {
                    oldNode.appendChild(newChildren[k].cloneNode(true));
                } else if (k >= newLen) {
                    oldNode.removeChild(oldChildren[k]);
                } else {
                    this.morphDOM(oldChildren[k], newChildren[k]);
                }
            }
        },

        scanDynamicDirectives: function () {
            var self = this;

            // 1. Polling: [switch-poll="3000"]
            document.querySelectorAll('[switch-poll]').forEach(function (el) {
                if (el._switchPollRegistered) return;
                el._switchPollRegistered = true;

                var interval = parseInt(el.getAttribute('switch-poll') || '5000', 10);
                var url = el.getAttribute('switch-poll-url') || window.location.href;
                var targetSel = self.getTargetSelector(el);

                var pollId = setInterval(function () {
                    if (!document.body.contains(el)) {
                        clearInterval(pollId);
                        return;
                    }
                    if (document.hidden) return;

                    self.navigate(url, {
                        method: 'GET',
                        target: targetSel,
                        pushState: false,
                        preserveScroll: true
                    });
                }, interval);

                self.activePolls.push(pollId);
            });

            // 2. Lazy Loading: [switch-lazy="/api/endpoint"]
            if ('IntersectionObserver' in window) {
                var lazyObserver = new IntersectionObserver(function (entries, observer) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            var el = entry.target;
                            var url = el.getAttribute('switch-lazy');
                            if (url && !el._switchLazyLoaded) {
                                el._switchLazyLoaded = true;
                                observer.unobserve(el);
                                var targetSel = self.getTargetSelector(el);
                                self.navigate(url, {
                                    method: 'GET',
                                    target: targetSel,
                                    pushState: false,
                                    preserveScroll: true
                                });
                            }
                        }
                    });
                }, { threshold: 0.1 });

                document.querySelectorAll('[switch-lazy]').forEach(function (el) {
                    if (!el._switchLazyLoaded) {
                        lazyObserver.observe(el);
                    }
                });

                // 3. Infinite Scroll: [switch-infinite="/posts?page=2"]
                var infiniteObserver = new IntersectionObserver(function (entries, observer) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            var sentinel = entry.target;
                            var url = sentinel.getAttribute('switch-infinite');
                            if (url && !sentinel._switchInfiniteLoading) {
                                sentinel._switchInfiniteLoading = true;
                                var targetSel = self.getTargetSelector(sentinel);
                                var isPrepend = sentinel.hasAttribute('switch-prepend');

                                self.navigate(url, {
                                    method: 'GET',
                                    target: targetSel,
                                    pushState: sentinel.hasAttribute('switch-push-url'),
                                    preserveScroll: true,
                                    append: !isPrepend,
                                    prepend: isPrepend
                                });
                            }
                        }
                    });
                }, { rootMargin: '200px' });

                document.querySelectorAll('[switch-infinite]').forEach(function (el) {
                    infiniteObserver.observe(el);
                });
            }

            // 4. Sortable Directives: [switch-sortable], [switch-sortable-group]
            document.querySelectorAll('[switch-sortable], [switch-sortable-group]').forEach(function (container) {
                var items = container.children;
                var handle = container.getAttribute('switch-handle');
                for (var s = 0; s < items.length; s++) {
                    var item = items[s];
                    if (!item.hasAttribute('draggable') && !item.hasAttribute('switch-no-drag')) {
                        item.setAttribute('draggable', 'true');
                    }
                    if (!handle && !item.classList.contains('cursor-grab')) {
                        item.classList.add('cursor-grab');
                    }
                }
            });
        },

        pausePolling: function () {
            // Polling paused automatically via document.hidden check
        },

        resumePolling: function () {
            // Automatically resumes
        },

        showLoadingState: function (el) {
            if (!el) return;
            if (el.hasAttribute('switch-disable')) {
                el.disabled = true;
                el.setAttribute('aria-disabled', 'true');
            }
            var indicator = el.getAttribute('switch-indicator');
            if (indicator) {
                var indEl = document.querySelector(indicator);
                if (indEl) indEl.classList.remove('switch-hidden');
            }
        },

        hideLoadingState: function (el) {
            if (!el) return;
            if (el.hasAttribute('switch-disable')) {
                el.disabled = false;
                el.removeAttribute('aria-disabled');
            }
            var indicator = el.getAttribute('switch-indicator');
            if (indicator) {
                var indEl = document.querySelector(indicator);
                if (indEl) indEl.classList.add('switch-hidden');
            }
        },

        setupProgressBar: function () {
            if (document.getElementById('switch-live-progress')) return;
            var bar = document.createElement('div');
            bar.id = 'switch-live-progress';
            document.body.appendChild(bar);
        },

        startProgressBar: function () {
            var bar = document.getElementById('switch-live-progress');
            if (!bar) return;
            bar.style.opacity = '1';
            bar.style.width = '0%';
            setTimeout(function () { bar.style.width = '35%'; }, 50);
            setTimeout(function () { bar.style.width = '75%'; }, 200);
        },

        finishProgressBar: function () {
            var bar = document.getElementById('switch-live-progress');
            if (!bar) return;
            bar.style.width = '100%';
            setTimeout(function () {
                bar.style.opacity = '0';
                setTimeout(function () { bar.style.width = '0%'; }, 200);
            }, 150);
        },

        setupToastContainer: function () {
            if (document.getElementById('switch-live-toasts')) return;
            var container = document.createElement('div');
            container.id = 'switch-live-toasts';
            document.body.appendChild(container);
        },

        showToast: function (message, type) {
            type = type || 'info';
            var container = document.getElementById('switch-live-toasts');
            if (!container) return;

            var toast = document.createElement('div');
            toast.className = 'switch-toast switch-toast-' + type;
            toast.innerHTML = '<span>' + message + '</span>';

            container.appendChild(toast);
            setTimeout(function () { toast.classList.add('switch-toast-visible'); }, 10);

            setTimeout(function () {
                toast.classList.remove('switch-toast-visible');
                setTimeout(function () { toast.remove(); }, 300);
            }, 4000);
        },

        injectStyles: function () {
            if (document.getElementById('switch-live-styles')) return;
            var style = document.createElement('style');
            style.id = 'switch-live-styles';
            style.textContent = [
                '#switch-live-progress { position: fixed; top: 0; left: 0; height: 2.5px; background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899); z-index: 999999; transition: width 0.25s ease, opacity 0.25s ease; opacity: 0; pointer-events: none; }',
                '.switch-hidden { display: none !important; }',
                '.switch-transition-fade { transition: opacity 0.2s ease-in-out; }',
                '.switch-transition-out { opacity: 0; transform: translateY(-4px); }',
                '.switch-transition-in { opacity: 1; transform: translateY(0); }',
                '#switch-live-toasts { position: fixed; bottom: 20px; right: 20px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; max-width: 420px; width: 100%; box-sizing: border-box; }',
                '.switch-toast { padding: 12px 18px; border-radius: 8px; font-size: 14px; line-height: 1.4; font-weight: 500; color: #fff; background: #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.2); transform: translateY(20px); opacity: 0; transition: transform 0.25s ease, opacity 0.25s ease; pointer-events: auto; word-break: break-word; }',
                '.switch-toast-visible { transform: translateY(0); opacity: 1; }',
                '.switch-toast-success { background: #10b981; }',
                '.switch-toast-error { background: #ef4444; }',
                '.switch-toast-warning { background: #f59e0b; }',
                '.switch-toast-info { background: #3b82f6; }',
                '.switch-dragging { opacity: 0.4 !important; transform: scale(0.98); }',
                '.switch-drop-active { outline: 2px dashed #6366f1 !important; outline-offset: -2px; }',
                '.cursor-grab { cursor: grab; user-select: none; }',
                '.cursor-grab:active { cursor: grabbing; }',
                '[switch-sortable] > *, [switch-sortable-group] > * { transition: transform 0.12s ease; }',
                '@media (max-width: 640px) {',
                '    #switch-live-toasts { left: 16px; right: 16px; bottom: max(16px, env(safe-area-inset-bottom)); width: auto; max-width: none; align-items: stretch; }',
                '    .switch-toast { text-align: center; font-size: 13.5px; padding: 10px 14px; border-radius: 10px; }',
                '}'
            ].join('\n');
            document.head.appendChild(style);
        },

        dispatchEvent: function (name, detail) {
            var event = new CustomEvent(name, { detail: detail, bubbles: true, cancelable: true });
            document.dispatchEvent(event);
        },

        debounce: function (func, wait) {
            var timeout;
            return function () {
                var context = this, args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function () { func.apply(context, args); }, wait);
            };
        },

        // Context API (React-like global and micro-state management)
        contexts: {},
        contextListeners: {},

        createContext: function (name, defaultValue) {
            if (!(name in this.contexts)) {
                this.contexts[name] = defaultValue !== undefined ? defaultValue : null;
                this.contextListeners[name] = [];
            }
            return this.contexts[name];
        },

        useContext: function (name, defaultValue) {
            if (name.indexOf('.') !== -1) {
                var parts = name.split('.');
                var root = parts[0];
                var val = this.contexts[root] !== undefined ? this.contexts[root] : defaultValue;
                for (var i = 1; i < parts.length; i++) {
                    if (val && typeof val === 'object' && parts[i] in val) {
                        val = val[parts[i]];
                    } else {
                        return defaultValue;
                    }
                }
                return val;
            }
            return this.contexts[name] !== undefined ? this.contexts[name] : defaultValue;
        },

        setContext: function (name, value) {
            var oldVal = this.contexts[name];
            if (typeof value === 'function') {
                this.contexts[name] = value(oldVal);
            } else {
                this.contexts[name] = value;
            }

            var newVal = this.contexts[name];
            this.notifyContext(name, newVal, oldVal);
            this.syncContextDOM(name, newVal);
            return newVal;
        },

        mutateContext: function (name, callback) {
            return this.setContext(name, callback);
        },

        subscribeContext: function (name, callback) {
            if (!this.contextListeners[name]) {
                this.contextListeners[name] = [];
            }
            this.contextListeners[name].push(callback);
            var self = this;
            return function () {
                var idx = self.contextListeners[name].indexOf(callback);
                if (idx !== -1) {
                    self.contextListeners[name].splice(idx, 1);
                }
            };
        },

        notifyContext: function (name, newVal, oldVal) {
            var listeners = this.contextListeners[name] || [];
            for (var i = 0; i < listeners.length; i++) {
                try {
                    listeners[i](newVal, oldVal);
                } catch (e) {
                    console.error('[SwitchLive] Context subscriber error:', e);
                }
            }
            this.dispatchEvent('switch:context-change', { name: name, value: newVal, oldValue: oldVal });
        },

        syncContextDOM: function (name, value) {
            // Update bound elements: [switch-bind="theme.mode"] or [data-bind="theme.mode"]
            var elements = document.querySelectorAll('[switch-bind^="' + name + '"], [data-bind^="' + name + '"]');
            for (var i = 0; i < elements.length; i++) {
                var el = elements[i];
                var bindPath = el.getAttribute('switch-bind') || el.getAttribute('data-bind');
                var val = this.useContext(bindPath);
                if (val !== undefined && val !== null) {
                    if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
                        el.value = val;
                    } else {
                        el.textContent = typeof val === 'object' ? JSON.stringify(val) : String(val);
                    }
                }
            }
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
