# Switch Live — Complete Documentation

> **Version**: 1.0.0  
> **Package**: `switch/live`  
> **License**: MIT  
> **Requires**: PHP ≥ 8.2, `switch/http-message`, `switch/view` (optional)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core Concepts](#core-concepts)
5. [HTML Attributes Reference](#html-attributes-reference)
   - [switch-to](#switch-to)
   - [switch-live-root](#switch-live-root)
   - [switch-target](#switch-target)
   - [switch-action](#switch-action)
   - [switch-click](#switch-click)
   - [switch-method](#switch-method)
   - [switch-data](#switch-data)
   - [switch-prefetch](#switch-prefetch)
   - [switch-search](#switch-search)
   - [switch-debounce](#switch-debounce)
   - [switch-change](#switch-change)
   - [switch-poll](#switch-poll)
   - [switch-poll-url](#switch-poll-url)
   - [switch-lazy](#switch-lazy)
   - [switch-infinite](#switch-infinite)
   - [switch-append](#switch-append)
   - [switch-prepend](#switch-prepend)
   - [switch-confirm](#switch-confirm)
   - [switch-disable](#switch-disable)
   - [switch-indicator](#switch-indicator)
   - [switch-transition](#switch-transition)
   - [switch-preserve-scroll](#switch-preserve-scroll)
   - [switch-push-url](#switch-push-url)
6. [Server-Side PHP API](#server-side-php-api)
   - [LiveResponse](#liveresponse)
   - [LiveMiddleware](#livemiddleware)
   - [LiveScript](#livescript)
   - [Helper Functions](#helper-functions)
7. [Client-Side JavaScript API](#client-side-javascript-api)
   - [SwitchLive Object](#switchlive-object)
   - [Lifecycle Events](#lifecycle-events)
   - [Programmatic Navigation](#programmatic-navigation)
   - [Toast Notifications](#toast-notifications)
8. [Recipes & Patterns](#recipes--patterns)
   - [Counter Component with Database](#counter-component-with-database)
   - [Like / Unlike Toggle](#like--unlike-toggle)
   - [Live Search with Results](#live-search-with-results)
   - [Real-Time Notification Badge](#real-time-notification-badge)
   - [Infinite Scroll Feed](#infinite-scroll-feed)
   - [Tab Navigation](#tab-navigation)
   - [Modal Forms](#modal-forms)
   - [Shopping Cart](#shopping-cart)
   - [Inline Edit / Save](#inline-edit--save)
   - [Filter Dropdown](#filter-dropdown)
   - [Delete with Confirmation](#delete-with-confirmation)
   - [Multi-Step Wizard](#multi-step-wizard)
9. [Architecture & How It Works](#architecture--how-it-works)
10. [CSS Classes Reference](#css-classes-reference)
11. [HTTP Headers Reference](#http-headers-reference)
12. [Browser Compatibility](#browser-compatibility)
13. [FAQ](#faq)

---

## Introduction

**Switch Live** is a lightweight (~7 KB gzipped), zero-dependency JavaScript engine that transforms traditional server-rendered PHP pages into fast, reactive single-page applications.

Instead of writing JavaScript components, API endpoints, and complex state management, you simply add HTML attributes to your existing elements. Switch Live handles:

- **Navigation** — Intercepts link clicks and form submissions, fetches the new page via AJAX, and swaps only the changed content.
- **DOM Morphing** — Instead of destructively replacing HTML with `innerHTML`, it walks the DOM tree and updates only changed nodes, preserving input focus, cursor position, scroll state, and media playback.
- **Reactivity** — Buttons can trigger server actions (POST/PUT/DELETE), receive updated HTML fragments, and re-render targeted sections — all without a single line of custom JavaScript.

### Why Switch Live Over Alternatives?

| Feature | Switch Live | Laravel Livewire | Turbo (Hotwire) | HTMX |
|---------|:-----------:|:----------------:|:---------------:|:----:|
| Zero JavaScript to write | ✅ | ✅ | ✅ | ✅ |
| Zero npm/build step | ✅ | ❌ | ❌ | ✅ |
| Smart DOM Morphing | ✅ | ✅ | ❌ | ❌ |
| Hover Prefetching | ✅ | ❌ | ❌ | ❌ |
| Auto Progress Bar | ✅ | ❌ | ✅ | ❌ |
| Server-Sent Toasts | ✅ | ❌ | ❌ | ❌ |
| Debounced Search | ✅ | ✅ | ❌ | ✅ |
| Infinite Scroll | ✅ | ❌ | ❌ | ✅ |
| Lazy Loading | ✅ | ✅ | ✅ | ✅ |
| Auto-Polling | ✅ | ✅ | ❌ | ✅ |
| CSS Transitions | ✅ | ❌ | ✅ | ✅ |
| File Size (gzipped) | ~7 KB | ~45 KB | ~25 KB | ~14 KB |

---

## Installation

```bash
composer require switch/live
```

No npm install, no webpack, no Vite, no build step required.

---

## Quick Start

### Step 1: Add `@liveScripts` to your layout

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    {!! head()->render() !!}
</head>
<body>
    <nav>
        <a href="/" switch-to>Home</a>
        <a href="/about" switch-to>About</a>
        <a href="/contact" switch-to>Contact</a>
    </nav>

    <main id="app" switch-live-root>
        <yield name="content" />
    </main>

    @liveScripts
</body>
</html>
```

### Step 2: Create pages as normal

```html
<!-- resources/views/about.switch.php -->
<extends layout="layouts.app" />
<block name="content">
    <h1>About Us</h1>
    <p>This page was loaded without a full page reload!</p>
</block>
```

### Step 3: Define routes as normal

```php
// routes/web.php
$router->get('/', [HomeController::class, 'index']);
$router->get('/about', [AboutController::class, 'index']);
$router->get('/contact', [ContactController::class, 'index']);
```

That's it. Every link with `switch-to` now navigates instantly without reloading.

---

## Core Concepts

### 1. Declarative Attributes
Switch Live is attribute-driven. You add HTML attributes (like `switch-to`, `switch-action`, `switch-target`) to elements to define behavior. No JavaScript required.

### 2. Server-Rendered HTML
Your controllers return standard HTML views. Switch Live fetches them via AJAX and swaps content. You never write JSON APIs for UI updates.

### 3. Targeted Updates
By default, the entire `[switch-live-root]` container is updated. Use `switch-target="#some-id"` to update only a specific section of the page.

### 4. Progressive Enhancement
Switch Live degrades gracefully. If JavaScript is disabled, all links and forms work as normal HTML. Your app is always functional.

---

## HTML Attributes Reference

### `switch-to`

**Purpose**: Marks an `<a>` link or `<form>` for SPA-style navigation.

**Elements**: `<a>`, `<form>`

```html
<!-- SPA link navigation -->
<a href="/users" switch-to>Users</a>

<!-- AJAX form submission -->
<form action="/login" method="POST" switch-to>
    <input type="email" name="email" />
    <input type="password" name="password" />
    <button type="submit">Login</button>
</form>
```

**Behavior**:
- On `<a>`: Intercepts click, fetches `href` via AJAX, updates target container, pushes URL to browser history.
- On `<form>`: Intercepts submit, sends form data via AJAX, updates target container.
- External links (`target="_blank"`), hash links (`#`), and modified clicks (Ctrl+Click, Cmd+Click) are not intercepted.

---

### `switch-live-root`

**Purpose**: Designates the main SPA container. This is the default element that gets updated during navigation if no `switch-target` is specified.

**Elements**: Any block element (typically `<main>`, `<div>`)

```html
<main id="app" switch-live-root>
    <!-- Content swapped here during SPA navigation -->
</main>
```

---

### `switch-target`

**Purpose**: Specifies which DOM element to update with the server response. Accepts any CSS selector.

**Elements**: Any element with `switch-to`, `switch-action`, `switch-click`, `switch-search`, `switch-poll`, `switch-lazy`, `switch-infinite`

```html
<!-- Update only the sidebar -->
<a href="/notifications" switch-to switch-target="#sidebar">Notifications</a>

<!-- Update a specific card -->
<button switch-action="/cart/add" switch-target="#cart-count">Add to Cart</button>

<!-- Can be placed on a parent container to cascade to children -->
<div switch-target="#results-panel">
    <a href="/search?q=php" switch-to>PHP</a>
    <a href="/search?q=js" switch-to>JavaScript</a>
</div>
```

---

### `switch-action`

**Purpose**: Triggers a server-side action from a `<button>` without a full form. Defaults to `POST` method.

**Elements**: `<button>`, any element with `[switch-click]`

```html
<!-- POST to increment a counter -->
<button switch-action="/counter/increment" switch-target="#counter-widget">
    + Increment
</button>

<!-- DELETE a record -->
<button 
    switch-action="/users/42" 
    switch-method="DELETE" 
    switch-target="#user-list"
    switch-confirm="Delete this user?"
>
    🗑️ Delete
</button>
```

---

### `switch-click`

**Purpose**: Same as `switch-action` but for any HTML element (not just buttons). Enables `<div>`, `<span>`, `<li>`, etc. to trigger server requests on click.

**Elements**: Any element

```html
<div switch-click="/api/toggle-theme" switch-target="#theme-display" class="cursor-pointer">
    🌙 Toggle Dark Mode
</div>
```

---

### `switch-method`

**Purpose**: Overrides the HTTP method for `switch-action` or `switch-click` requests.

**Default**: `POST` for `switch-action`, `GET` for `switch-to`

**Values**: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`

```html
<button switch-action="/posts/15" switch-method="PUT" switch-target="#post-15">
    Save Changes
</button>

<button switch-action="/posts/15" switch-method="DELETE" switch-target="#post-list">
    Delete Post
</button>
```

---

### `switch-data`

**Purpose**: Sends a JSON payload with the request as form data fields.

**Elements**: Any element with `switch-action`, `switch-click`, or `switch-to`

```html
<!-- Send product data to add-to-cart endpoint -->
<button 
    switch-action="/cart/add" 
    switch-data='{"product_id": 42, "quantity": 2, "color": "blue"}'
    switch-target="#cart-widget"
>
    🛒 Add to Cart
</button>
```

---

### `switch-prefetch`

**Purpose**: Preloads the destination page into memory when the user hovers over a link. The cached response is used instantly when the user clicks.

**Cache Duration**: 30 seconds

**Elements**: `<a>` with `switch-to`

```html
<a href="/dashboard" switch-to switch-prefetch>Dashboard (Instant)</a>
<a href="/analytics" switch-to switch-prefetch>Analytics (Instant)</a>
```

**How It Works**:
1. User hovers → `fetch()` fires in background with `X-Switch-Prefetch: 1` header.
2. Response HTML is stored in an in-memory cache.
3. User clicks → cached HTML is applied instantly (no network wait).
4. Cache entry expires after 30 seconds.

---

### `switch-search`

**Purpose**: Triggers a live AJAX search request as the user types into an input field. The input value is appended as a query parameter.

**Elements**: `<input>`, `<textarea>`

```html
<input 
    type="text" 
    name="q" 
    placeholder="Search users..." 
    switch-search="/users/search" 
    switch-target="#user-results" 
    switch-debounce="400"
/>

<div id="user-results">
    <!-- Results rendered here as user types -->
</div>
```

**Parameters**:
- The input's `name` attribute is used as the query parameter key (defaults to `q`).
- The URL becomes `/users/search?q=john` as the user types "john".

---

### `switch-debounce`

**Purpose**: Sets the debounce delay (in milliseconds) for `switch-search` and `switch-input` elements.

**Default**: `300` ms

```html
<!-- Fast 150ms debounce for quick filtering -->
<input switch-search="/api/autocomplete" switch-debounce="150" />

<!-- Slower 800ms debounce for heavy database queries -->
<input switch-search="/api/full-search" switch-debounce="800" />
```

---

### `switch-change`

**Purpose**: Triggers a request when a `<select>` dropdown or checkbox value changes.

**Elements**: `<select>`, `<input type="checkbox">`

```html
<select name="category" switch-change="/products" switch-target="#product-grid">
    <option value="all">All Categories</option>
    <option value="electronics">Electronics</option>
    <option value="clothing">Clothing</option>
</select>

<div id="product-grid">
    <!-- Products filtered by category -->
</div>
```

---

### `switch-poll`

**Purpose**: Automatically re-fetches and updates a component on a timed interval.

**Value**: Interval in milliseconds

**Elements**: Any block element

```html
<!-- Refresh every 5 seconds -->
<div 
    id="notifications" 
    switch-poll="5000" 
    switch-poll-url="/api/notifications" 
    switch-target="#notifications"
>
    <span class="badge">{{ $unreadCount }}</span>
</div>

<!-- Refresh every 2 seconds -->
<div 
    id="stock-price" 
    switch-poll="2000" 
    switch-poll-url="/api/stock/AAPL" 
    switch-target="#stock-price"
>
    ${{ $price }}
</div>
```

**Behavior**:
- Automatically pauses when the browser tab is hidden (saves CPU/battery).
- Automatically resumes when the tab becomes visible.
- Automatically stops when the element is removed from the DOM.

---

### `switch-poll-url`

**Purpose**: Specifies the URL to poll. Defaults to `window.location.href` if omitted.

```html
<div switch-poll="3000" switch-poll-url="/api/server-health" switch-target="#health-status">
    Status: {{ $status }}
</div>
```

---

### `switch-lazy`

**Purpose**: Loads content via AJAX only when the element scrolls into the browser viewport.

**Elements**: Any block element

```html
<!-- Chart loads only when user scrolls to it -->
<div 
    id="sales-chart" 
    switch-lazy="/widgets/sales-chart" 
    switch-target="#sales-chart"
>
    <div class="skeleton-loader">Loading chart...</div>
</div>

<!-- Comments section loads lazily -->
<div 
    id="comments" 
    switch-lazy="/posts/42/comments" 
    switch-target="#comments"
>
    <p>Loading comments...</p>
</div>
```

**How It Works**: Uses `IntersectionObserver` with a 10% visibility threshold. The element is fetched exactly once.

---

### `switch-infinite`

**Purpose**: Triggers a paginated fetch when the sentinel element enters the viewport. Typically used with `switch-append` to append new content.

**Elements**: Any element (usually a sentinel `<div>` at the bottom of a list)

```html
<div id="post-feed">
    <foreach items="$posts" as="$post">
        <article>{{ $post.title }}</article>
    </foreach>
</div>

<!-- Sentinel: triggers next page fetch -->
<div 
    switch-infinite="/posts?page={{ $nextPage }}" 
    switch-target="#post-feed" 
    switch-append
>
    <span class="spinner">Loading more...</span>
</div>
```

**How It Works**: Uses `IntersectionObserver` with a 200px root margin (triggers slightly before element is visible for a seamless experience).

---

### `switch-append`

**Purpose**: Appends new content to the target container instead of replacing it. Used with `switch-infinite`.

```html
<div switch-infinite="/feed?page=2" switch-target="#feed" switch-append>
    Loading...
</div>
```

---

### `switch-prepend`

**Purpose**: Prepends new content to the beginning of the target container. Used with `switch-infinite` for reverse chronological feeds.

```html
<div switch-infinite="/messages?before=123" switch-target="#messages" switch-prepend>
    Loading older messages...
</div>
```

---

### `switch-confirm`

**Purpose**: Shows a native browser confirmation dialog before executing the request. The request is cancelled if the user clicks "Cancel".

**Elements**: `<a>`, `<button>`, `<form>`

```html
<a 
    href="/account/delete" 
    switch-to 
    switch-confirm="Are you sure? This action cannot be undone."
>
    Delete Account
</a>

<form action="/reset-database" method="POST" switch-to switch-confirm="Reset all data?">
    <button type="submit">Reset</button>
</form>
```

---

### `switch-disable`

**Purpose**: Automatically disables the element while the request is in flight. Prevents double-clicks and duplicate submissions.

**Elements**: `<button>`, `<input type="submit">`

```html
<button 
    type="submit" 
    switch-disable
>
    Submit Order
</button>
```

**Behavior**: Sets `disabled` attribute and `aria-disabled="true"` during the request. Removes both after the response is received.

---

### `switch-indicator`

**Purpose**: Toggles the visibility of a loading indicator element while the request is in flight.

**Value**: CSS selector of the indicator element

```html
<button 
    type="submit" 
    switch-disable 
    switch-indicator="#save-spinner"
>
    Save Changes
</button>

<span id="save-spinner" class="switch-hidden">
    ⏳ Saving...
</span>
```

The `.switch-hidden` class is automatically removed when the request starts and re-added when it finishes.

---

### `switch-transition`

**Purpose**: Applies a CSS animation during page transitions.

**Values**: `fade` (more transition types coming soon)

**Elements**: `<a>` with `switch-to`

```html
<a href="/gallery" switch-to switch-transition="fade">Gallery</a>
```

**How It Works**:
1. Adds `.switch-transition-out` class (opacity fades to 0, slight upward shift).
2. Waits 150ms, then swaps the DOM content.
3. Adds `.switch-transition-in` class (opacity fades to 1, element settles).
4. Removes transition classes after 250ms.

---

### `switch-preserve-scroll`

**Purpose**: Maintains the user's current scroll position after the response is applied. Useful for inline actions like liking a post, voting, or toggling.

**Elements**: `<a>`, `<button>`, `<form>`

```html
<form action="/posts/10/like" method="POST" switch-to switch-preserve-scroll>
    <button type="submit">❤️ Like</button>
</form>
```

---

### `switch-push-url`

**Purpose**: Controls whether the URL in the browser address bar is updated after the request. On `<a>` links this defaults to `true`; on buttons and actions it defaults to `false`.

**Values**: `true` or `false` (attribute presence = true)

```html
<!-- Update URL when search results change -->
<input switch-search="/search" switch-push-url />

<!-- Don't update URL on action -->
<button switch-action="/counter/increment" switch-push-url="false">+1</button>
```

---

## Server-Side PHP API

### LiveResponse

The `LiveResponse` class provides static methods to control client-side behavior from your PHP controllers via HTTP response headers.

```php
use Switch\Live\LiveResponse;
```

#### `LiveResponse::isLiveRequest(): bool`

Check if the current request was made by Switch Live (AJAX navigation).

```php
if (LiveResponse::isLiveRequest()) {
    // Return only the partial HTML fragment
    return view('partials.user-card', ['user' => $user]);
} else {
    // Return full page with layout
    return view('users.show', ['user' => $user]);
}
```

#### `LiveResponse::toast(string $message, string $type = 'info'): void`

Show a floating toast notification on the client.

**Types**: `success`, `error`, `warning`, `info`

```php
LiveResponse::toast('Settings saved!', 'success');
LiveResponse::toast('Invalid email address.', 'error');
LiveResponse::toast('Your trial expires in 3 days.', 'warning');
LiveResponse::toast('New version available.', 'info');
```

#### `LiveResponse::emit(string $event, array $detail = []): void`

Dispatch a custom JavaScript event on the client's `document`.

```php
LiveResponse::emit('cart-updated', ['itemCount' => 5, 'total' => 129.99]);
```

Listen on the client:

```javascript
document.addEventListener('cart-updated', (e) => {
    console.log('Cart has', e.detail.itemCount, 'items');
    console.log('Total:', e.detail.total);
});
```

#### `LiveResponse::redirect(string $url): void`

Trigger a seamless SPA redirect on the client (no full page reload).

```php
LiveResponse::redirect('/dashboard');
```

#### `LiveResponse::title(string $title): void`

Dynamically update the browser's document title.

```php
LiveResponse::title('Edit User #42 — Admin Panel');
```

#### `LiveResponse::target(string $selector): void`

Override the target container on the server side. The response HTML will be rendered into this container.

```php
LiveResponse::target('#modal-body');
```

#### `LiveResponse::preserveScroll(bool $preserve = true): void`

Tell the client to maintain the current scroll position.

```php
LiveResponse::preserveScroll();
```

#### `LiveResponse::setHeaders(?string $title, ?string $target): void`

Set multiple Live response headers at once (legacy method).

```php
LiveResponse::setHeaders('Page Title', '#content');
```

---

### LiveMiddleware

PSR-15 middleware that detects Switch Live requests and adds the `X-Switch-Live: 1` response header.

```php
use Switch\Live\Middleware\LiveMiddleware;

// Register in your middleware stack
$app->pipe(new LiveMiddleware());
```

---

### LiveScript

Renders the Switch Live JavaScript into your HTML.

```php
use Switch\Live\LiveScript;

// Inline script tag (default)
echo LiveScript::render(true);

// External script reference
echo LiveScript::render(false);
```

---

### Helper Functions

#### `live_scripts(): string`

Global helper that renders the Switch Live script tag.

```php
echo live_scripts();
```

#### `is_live(): bool`

Global helper that checks if the current request is a Switch Live request.

```php
if (is_live()) {
    return view('partials.content');
}
```

#### `@liveScripts` (View Directive)

Template directive that renders the script tag in Switch View templates.

```html
@liveScripts
```

---

## Client-Side JavaScript API

### SwitchLive Object

The `window.SwitchLive` object is available globally after the script loads.

#### `SwitchLive.navigate(url, options)`

Programmatically navigate to a URL:

```javascript
SwitchLive.navigate('/users', {
    method: 'GET',
    target: '#content',
    pushState: true,
    preserveScroll: false,
    transition: 'fade'
});
```

**Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `method` | string | `'GET'` | HTTP method |
| `body` | FormData/string | `null` | Request body |
| `target` | string | `'[switch-live-root]'` | CSS selector of target container |
| `pushState` | boolean | `true` | Update browser URL |
| `preserveScroll` | boolean | `false` | Keep current scroll position |
| `transition` | string | `null` | CSS transition name |
| `triggerElement` | Element | `null` | Element that triggered the request |

#### `SwitchLive.showToast(message, type)`

Programmatically show a toast from JavaScript:

```javascript
SwitchLive.showToast('Item added to cart!', 'success');
SwitchLive.showToast('Connection lost.', 'error');
```

#### `SwitchLive.prefetch(url)`

Manually prefetch a URL into the cache:

```javascript
SwitchLive.prefetch('/users');
SwitchLive.prefetch('/settings');
```

---

### Lifecycle Events

All events are dispatched on `document` and bubble up.

| Event | `e.detail` | Fires When |
|-------|-----------|------------|
| `switch:live:start` | `{ url, options }` | Request begins |
| `switch:live:success` | `{ url, html }` | DOM successfully updated |
| `switch:live:error` | `{ status, html }` or `{ error }` | Request fails |
| `switch:live:finish` | `{ url }` | Request lifecycle complete (success or error) |

```javascript
document.addEventListener('switch:live:start', (e) => {
    console.log('Loading:', e.detail.url);
});

document.addEventListener('switch:live:success', (e) => {
    // Re-initialize third-party plugins after DOM update
    hljs.highlightAll();
});

document.addEventListener('switch:live:error', (e) => {
    if (e.detail.status === 401) {
        window.location.href = '/login';
    }
});
```

---

## Recipes & Patterns

### Counter Component with Database

A classic React-like counter that persists to your database.

**Model** (`app/Models/Counter.php`):
```php
<?php

namespace App\Models;

use Switch\Database\ORM\Model;

class Counter extends Model
{
    protected string $table = 'counters';
    protected array $fillable = ['name', 'count'];
}
```

**Controller** (`app/Controllers/CounterController.php`):
```php
<?php

namespace App\Controllers;

use App\Models\Counter;
use Switch\Live\LiveResponse;

class CounterController
{
    public function index()
    {
        $counter = Counter::firstOrCreate(['name' => 'main'], ['count' => 0]);
        return view('counter', ['counter' => $counter]);
    }

    public function increment()
    {
        $counter = Counter::findOrFail(1);
        $counter->count++;
        $counter->save();

        LiveResponse::toast("Count: {$counter->count}", 'success');
        return view('partials.counter-display', ['counter' => $counter]);
    }

    public function decrement()
    {
        $counter = Counter::findOrFail(1);
        $counter->count--;
        $counter->save();

        return view('partials.counter-display', ['counter' => $counter]);
    }
}
```

**Routes**:
```php
$router->get('/counter', [CounterController::class, 'index']);
$router->post('/counter/increment', [CounterController::class, 'increment']);
$router->post('/counter/decrement', [CounterController::class, 'decrement']);
```

**Partial View** (`resources/views/partials/counter-display.switch.php`):
```html
<div id="counter-widget">
    <h1>{{ $counter.count }}</h1>
    <button switch-action="/counter/decrement" switch-target="#counter-widget">−</button>
    <button switch-action="/counter/increment" switch-target="#counter-widget">+</button>
</div>
```

---

### Like / Unlike Toggle

```html
<div id="like-btn-{{ $post.id }}">
    @if($post->isLikedBy($user))
        <button 
            switch-action="/posts/{{ $post.id }}/unlike" 
            switch-target="#like-btn-{{ $post.id }}"
        >
            ❤️ {{ $post.likes_count }}
        </button>
    @else
        <button 
            switch-action="/posts/{{ $post.id }}/like" 
            switch-target="#like-btn-{{ $post.id }}"
        >
            🤍 {{ $post.likes_count }}
        </button>
    @endif
</div>
```

---

### Live Search with Results

```html
<div class="search-container">
    <input 
        type="text" 
        name="q" 
        placeholder="Search articles..." 
        switch-search="/articles/search" 
        switch-target="#search-results" 
        switch-debounce="250"
    />

    <div id="search-results">
        @if(isset($articles))
            <foreach items="$articles" as="$article">
                <a href="/articles/{{ $article.slug }}" switch-to>
                    <h3>{{ $article.title }}</h3>
                    <p>{{ $article.excerpt }}</p>
                </a>
            </foreach>
        @else
            <p>Start typing to search...</p>
        @endif
    </div>
</div>
```

**Controller**:
```php
public function search()
{
    $query = $_GET['q'] ?? '';
    $articles = Article::where('title', 'LIKE', "%{$query}%")->limit(10)->get();
    
    LiveResponse::preserveScroll();
    return view('partials.search-results', ['articles' => $articles]);
}
```

---

### Real-Time Notification Badge

```html
<div 
    id="notification-badge" 
    switch-poll="10000" 
    switch-poll-url="/api/notifications/count" 
    switch-target="#notification-badge"
>
    @if($unreadCount > 0)
        <span class="badge">{{ $unreadCount }}</span>
    @endif
    🔔 Notifications
</div>
```

---

### Infinite Scroll Feed

```html
<div id="timeline">
    <foreach items="$posts" as="$post">
        <article class="post">
            <h2>{{ $post.title }}</h2>
            <p>{{ $post.excerpt }}</p>
        </article>
    </foreach>
</div>

@if($hasMorePages)
    <div 
        switch-infinite="/feed?page={{ $currentPage + 1 }}" 
        switch-target="#timeline" 
        switch-append
    >
        <div class="loading-spinner">Loading more posts...</div>
    </div>
@endif
```

**Controller**:
```php
public function feed()
{
    $page = (int) ($_GET['page'] ?? 1);
    $posts = Post::orderBy('created_at', 'desc')->paginate(20, $page);

    if (LiveResponse::isLiveRequest()) {
        return view('partials.feed-items', [
            'posts' => $posts->items(),
            'hasMorePages' => $posts->hasMorePages(),
            'currentPage' => $page,
        ]);
    }

    return view('feed', [
        'posts' => $posts->items(),
        'hasMorePages' => $posts->hasMorePages(),
        'currentPage' => $page,
    ]);
}
```

---

### Tab Navigation

```html
<div class="tabs">
    <button switch-action="/settings/general" switch-target="#tab-content" class="tab active">
        General
    </button>
    <button switch-action="/settings/security" switch-target="#tab-content" class="tab">
        Security
    </button>
    <button switch-action="/settings/billing" switch-target="#tab-content" class="tab">
        Billing
    </button>
</div>

<div id="tab-content">
    <!-- Tab content loaded here -->
</div>
```

---

### Modal Forms

```html
<!-- Trigger button -->
<button switch-action="/users/create/form" switch-target="#modal-body" switch-method="GET">
    + New User
</button>

<!-- Modal container -->
<div id="modal-body">
    <!-- Form loaded here via AJAX -->
</div>
```

**The form partial** (`partials/user-form.switch.php`):
```html
<div id="modal-body">
    <form action="/users" method="POST" switch-to switch-target="#user-list">
        @csrf
        <input type="text" name="name" placeholder="Full Name" required />
        <input type="email" name="email" placeholder="Email" required />
        <button type="submit" switch-disable>Create User</button>
    </form>
</div>
```

**Controller**:
```php
public function store()
{
    $user = User::create($_POST);
    LiveResponse::toast("User {$user->name} created!", 'success');
    LiveResponse::target('#user-list');
    return view('partials.user-list', ['users' => User::all()]);
}
```

---

### Shopping Cart

```html
<!-- Add to Cart Button -->
<button 
    switch-action="/cart/add" 
    switch-data='{"product_id": {{ $product.id }}, "qty": 1}'
    switch-target="#cart-widget"
>
    🛒 Add to Cart
</button>

<!-- Cart Widget (in navbar) -->
<div id="cart-widget">
    <span>🛒 {{ $cartCount }} items — ${{ $cartTotal }}</span>
</div>
```

---

### Inline Edit / Save

```html
<!-- Display Mode -->
<div id="user-name-42">
    <span>{{ $user.name }}</span>
    <button switch-action="/users/42/edit-name" switch-target="#user-name-42" switch-method="GET">
        ✏️ Edit
    </button>
</div>
```

**Edit form partial**:
```html
<div id="user-name-42">
    <form action="/users/42/update-name" method="POST" switch-to switch-target="#user-name-42">
        @csrf
        <input type="text" name="name" value="{{ $user.name }}" autofocus />
        <button type="submit" switch-disable>Save</button>
        <button type="button" switch-action="/users/42/show-name" switch-target="#user-name-42" switch-method="GET">
            Cancel
        </button>
    </form>
</div>
```

---

### Filter Dropdown

```html
<select name="status" switch-change="/orders" switch-target="#order-table">
    <option value="">All Orders</option>
    <option value="pending">Pending</option>
    <option value="processing">Processing</option>
    <option value="completed">Completed</option>
    <option value="cancelled">Cancelled</option>
</select>

<table id="order-table">
    <!-- Filtered rows rendered here -->
</table>
```

---

### Delete with Confirmation

```html
<button 
    switch-action="/posts/{{ $post.id }}" 
    switch-method="DELETE" 
    switch-target="#post-{{ $post.id }}" 
    switch-confirm="Delete this post permanently?"
>
    🗑️ Delete
</button>

<div id="post-{{ $post.id }}">
    <!-- Post card content -->
</div>
```

**Controller**:
```php
public function destroy(int $id)
{
    Post::findOrFail($id)->delete();
    LiveResponse::toast('Post deleted.', 'success');

    // Return empty content to remove the card from the DOM
    return '';
}
```

---

### Multi-Step Wizard

```html
<div id="wizard-container">
    <!-- Step 1: Personal Info -->
    <form action="/wizard/step-2" method="POST" switch-to switch-target="#wizard-container">
        @csrf
        <h2>Step 1: Personal Information</h2>
        <input type="text" name="name" required />
        <input type="email" name="email" required />
        <button type="submit" switch-disable>Next →</button>
    </form>
</div>
```

Each step's controller returns the next step's form HTML targeted to `#wizard-container`.

---

## Architecture & How It Works

```
┌──────────────┐    click / submit    ┌──────────────┐
│              │ ──────────────────→  │              │
│   Browser    │   fetch() + headers  │  PHP Server  │
│  (switch-    │ ←──────────────────  │  (Controller │
│   live.js)   │   HTML response +    │   + Model)   │
│              │   X-Switch-* headers │              │
└──────────────┘                      └──────────────┘
       │                                     │
       │  1. Intercept click/submit          │  4. Process request
       │  2. Show progress bar               │  5. Query database
       │  3. Send fetch() with headers       │  6. Render view partial
       │                                     │  7. Set response headers
       │  8. Receive HTML                    │
       │  9. Parse with DOMParser            │
       │  10. Morph target element           │
       │  11. Update title & URL             │
       │  12. Show toast notifications       │
       │  13. Hide progress bar              │
       └─────────────────────────────────────┘
```

### Request Flow

1. User interacts with an element that has a Switch Live attribute.
2. `switch-live.js` intercepts the event (click, submit, input, change, scroll).
3. A `fetch()` request is sent with `X-Switch-Live: 1` and `X-Requested-With: XMLHttpRequest` headers.
4. Your PHP controller processes the request normally.
5. The controller returns an HTML view (full page or partial).
6. `switch-live.js` parses the response HTML using `DOMParser`.
7. The target container is updated using the DOM morphing algorithm.
8. Browser history, document title, and scroll position are updated.
9. Any `X-Switch-Toast`, `X-Switch-Event`, or `X-Switch-Redirect` headers are processed.

---

## CSS Classes Reference

These CSS classes are injected automatically by Switch Live:

| Class | Purpose |
|-------|---------|
| `.switch-loading` | Added to `<body>` during any active request |
| `.switch-hidden` | `display: none !important` — used by `switch-indicator` |
| `.switch-transition-out` | Applied during the "exit" phase of a page transition |
| `.switch-transition-in` | Applied during the "enter" phase of a page transition |
| `.switch-transition-fade` | Fade transition class |
| `.switch-toast` | Base toast notification styling |
| `.switch-toast-visible` | Makes a toast visible with animation |
| `.switch-toast-success` | Green toast |
| `.switch-toast-error` | Red toast |
| `.switch-toast-warning` | Amber toast |
| `.switch-toast-info` | Blue toast |

### Custom Loading Styles

```css
/* Show a loading overlay during navigation */
body.switch-loading::after {
    content: '';
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.1);
    z-index: 9999;
    pointer-events: none;
}

/* Dim the target area during loading */
body.switch-loading [switch-live-root] {
    opacity: 0.6;
    pointer-events: none;
    transition: opacity 0.15s ease;
}
```

---

## HTTP Headers Reference

### Request Headers (Client → Server)

| Header | Value | Description |
|--------|-------|-------------|
| `X-Switch-Live` | `1` | Identifies a Switch Live AJAX request |
| `X-Requested-With` | `XMLHttpRequest` | Standard AJAX identifier |
| `X-Switch-Prefetch` | `1` | Indicates a prefetch (hover) request |

### Response Headers (Server → Client)

| Header | Value | Description |
|--------|-------|-------------|
| `X-Switch-Live` | `1` | Confirms a Live response |
| `X-Switch-Title` | string | Updates the document title |
| `X-Switch-Target` | CSS selector | Overrides the target container |
| `X-Switch-Toast` | JSON string | Shows a toast notification |
| `X-Switch-Event` | JSON string | Dispatches a custom JS event |
| `X-Switch-Redirect` | URL string | Triggers a seamless SPA redirect |
| `X-Switch-Scroll` | `preserve` | Preserves the scroll position |

---

## Browser Compatibility

Switch Live works in all modern browsers:

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 63+ |
| Firefox | 58+ |
| Safari | 12+ |
| Edge | 79+ |
| Opera | 50+ |
| iOS Safari | 12+ |
| Chrome Android | 63+ |

**Required Web APIs**: `fetch`, `DOMParser`, `CustomEvent`, `IntersectionObserver`, `MutationObserver`, `FormData`, `URL`, `history.pushState`.

---

## FAQ

### Can I use Switch Live with existing JavaScript?

Yes. Switch Live does not conflict with any existing JavaScript. Use lifecycle events (`switch:live:success`) to re-initialize third-party scripts (e.g., syntax highlighters, chart libraries) after DOM updates.

### Does it work without the Switch View engine?

Yes. Switch Live is framework-agnostic on the client side. Any PHP backend that returns HTML can work — you just need to include the `switch-live.js` script.

### How do I handle form validation errors?

Return the same form view with error messages. The DOM morphing will update the form in-place, preserving any values the user already entered.

### Can I use it for file uploads?

Yes. `<form>` elements with `switch-to` automatically use `FormData`, which supports `<input type="file">`.

### How do I skip Switch Live for a specific link?

Don't add `switch-to` to it. Only elements with Switch Live attributes are intercepted.

### How do I force a full page reload?

```javascript
window.location.href = '/some-page';
```

Or simply use a regular link without `switch-to`.

---

## License

Switch Live is open-source software licensed under the [MIT License](LICENSE).

**© celionatti — Switch Framework**
