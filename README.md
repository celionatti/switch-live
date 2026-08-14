# Switch Live (`switch/live`)

[![Latest Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/celionatti/switch-live)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-%3E%3D8.2-777bb4.svg)](https://php.net)

**Switch Live** is a zero-dependency, ultra-fast SPA navigation, DOM morphing, and reactive component engine for the **Switch Framework**.

It gives you the reactivity, speed, and smooth UX of modern JavaScript frameworks (like React, Vue, Turbo, and Livewire) directly in native PHP templates — with **zero JavaScript compilation, zero npm packages, and zero build steps**.

---

## ⚡ Key Features

- 🚀 **Zero Page Reloads**: Seamless SPA-like link navigation and AJAX form submissions.
- 🧠 **Smart DOM Morphing**: Replaces only changed DOM nodes while preserving input focus, cursor positions, form state, and media playback.
- ⚡ **Hover Prefetching (`switch-prefetch`)**: Preloads destination pages on mouse hover for **0ms perceived latency**.
- 📊 **Automatic Top Progress Bar**: YouTube/GitHub-style animated top loading bar.
- ⏱️ **Intelligent Polling (`switch-poll`)**: Periodically updates widgets with automatic tab-visibility pausing to save CPU and battery.
- 👁️ **Viewport Lazy Loading (`switch-lazy`)**: Loads heavy components on-demand as they enter the screen.
- 🔍 **Debounced Live Search (`switch-search`)**: Real-time filtering and live search with customizable debounce timeouts.
- 📜 **Infinite Scroll (`switch-infinite`)**: Automatically fetches and appends paginated feeds.
- ⚠️ **Confirmation Prompts (`switch-confirm`)**: Built-in confirmation dialogs for destructive actions.
- 🍞 **Server-Sent Toasts & Events (`LiveResponse`)**: Trigger floating notifications, custom JS events, and seamless redirects straight from PHP controllers.
- 🎨 **Hardware-Accelerated Transitions (`switch-transition`)**: Smooth CSS animations between navigations.
- 📱 **100% Mobile-Responsive**: Built-in safe-area insets and touch-friendly controls.

---

## 📦 Installation

Install via Composer into your Switch project:

```bash
composer require switch/live
```

---

## 🚀 Quick Setup

Include `@liveScripts` before the closing `</body>` tag in your layout view (`resources/views/layouts/app.switch.php`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
    {!! head()->render() !!}
</head>
<body>
    <!-- Main SPA Container -->
    <main id="app" switch-live-root>
        <yield name="content" />
    </main>

    <!-- Injects the lightweight Switch Live script -->
    @liveScripts
</body>
</html>
```

---

## 📖 Comprehensive Documentation & Usage

### 1. Seamless SPA Navigation (`switch-to`)

Add `switch-to` to any `<a>` link or `<form>` to navigate without full page reloads:

```html
<!-- SPA Link Navigation -->
<a href="/dashboard" switch-to>Dashboard</a>
<a href="/profile" switch-to>Profile</a>

<!-- AJAX Form Submission -->
<form action="/login" method="POST" switch-to>
    @csrf
    <input type="email" name="email" required />
    <input type="password" name="password" required />
    <button type="submit">Log In</button>
</form>
```

---

### 2. Targeted Component Updates (`switch-target`)

By default, Switch Live updates the main container (`[switch-live-root]`). You can target specific sections by providing a CSS selector:

```html
<!-- Updates only the #content-box element -->
<a href="/users/edit/5" switch-to switch-target="#content-box">Edit User</a>

<div id="content-box">
    <!-- User edit form loaded here -->
</div>
```

---

### 3. Reactive Button Actions & Payloads (`switch-action`)

Trigger controller actions directly from buttons with custom HTTP methods and JSON data:

```html
<!-- Increment Counter -->
<button 
    switch-action="/counter/increment" 
    switch-target="#counter-widget"
    class="btn btn-primary"
>
    + Increment
</button>

<!-- Send Custom Payload -->
<button 
    switch-action="/cart/add" 
    switch-data='{"product_id": 42, "qty": 1}'
    switch-target="#cart-summary"
>
    Add to Cart
</button>
```

---

### 4. Hover Prefetching (`switch-prefetch`)

Preloads pages into memory the instant the user's cursor hovers over a link:

```html
<a href="/analytics" switch-to switch-prefetch>
    Analytics (Instant 0ms Load)
</a>
```

---

### 5. Debounced Live Search & Real-Time Inputs (`switch-search`)

Trigger live database queries as the user types with automatic debouncing:

```html
<input 
    type="text" 
    name="q" 
    placeholder="Search products..." 
    switch-search="/products/search" 
    switch-target="#product-grid" 
    switch-debounce="300"
    switch-push-url="true"
/>

<div id="product-grid">
    <!-- Search results rendered dynamically here -->
</div>
```

---

### 6. Auto-Polling / Live Widgets (`switch-poll`)

Automatically re-fetches a component on a timed interval. Automatically pauses when the browser tab is hidden:

```html
<div 
    id="server-stats" 
    switch-poll="3000" 
    switch-poll-url="/api/server-stats"
    switch-target="#server-stats"
>
    <span>CPU Load: {{ $stats.cpu }}%</span>
    <span>RAM Usage: {{ $stats.ram }}%</span>
</div>
```

---

### 7. Viewport Lazy Loading (`switch-lazy`)

Defers loading of non-critical or slow components until the user scrolls down to them:

```html
<div 
    switch-lazy="/widgets/sales-chart" 
    switch-target="#sales-chart-container"
    id="sales-chart-container"
>
    <div class="skeleton-loader">Loading sales chart...</div>
</div>
```

---

### 8. Infinite Scroll & Append (`switch-infinite`)

Fetch and append new rows to a feed when the user scrolls to the bottom of the page:

```html
<div id="feed-container">
    <foreach items="$posts" as="$post">
        <article class="post-card">{{ $post.title }}</article>
    </foreach>
</div>

<!-- Triggers next page fetch when scrolled into view -->
<div 
    switch-infinite="/feed?page={{ $nextPage }}" 
    switch-target="#feed-container" 
    switch-append
>
    Loading more posts...
</div>
```

---

### 9. Confirmation Dialogs (`switch-confirm`)

Prevent accidental submissions or deletions with confirmation dialogs:

```html
<a 
    href="/account/delete" 
    switch-to 
    switch-confirm="Are you sure you want to permanently delete your account?"
    class="text-red-500"
>
    Delete Account
</a>
```

---

### 10. Disable & Loading Indicators (`switch-disable` & `switch-indicator`)

Prevent duplicate form submissions and show loading spinners while requests are in flight:

```html
<form action="/checkout" method="POST" switch-to>
    @csrf
    
    <button type="submit" switch-disable switch-indicator="#checkout-spinner">
        Place Order
    </button>

    <span id="checkout-spinner" class="switch-hidden">
        Processing payment...
    </span>
</form>
```

---

### 11. CSS Page Transitions (`switch-transition`)

Apply smooth animations between page transitions:

```html
<a href="/about" switch-to switch-transition="fade">About Us</a>
```

---

### 12. Scroll Preservation (`switch-preserve-scroll`)

Maintain the user's scroll position when liking a post, submitting a form, or clicking pagination:

```html
<form action="/posts/10/like" method="POST" switch-to switch-preserve-scroll>
    @csrf
    <button type="submit">❤️ Like</button>
</form>
```

---

## 🖥️ Server-Side Control (`LiveResponse`)

Control client UI directly from your PHP controllers:

```php
namespace App\Controllers;

use Switch\Live\LiveResponse;

class UserController
{
    public function update()
    {
        // 1. Trigger Floating Toast Notification ('success', 'error', 'warning', 'info')
        LiveResponse::toast('Profile updated successfully!', 'success');

        // 2. Dispatch Custom JavaScript Event
        LiveResponse::emit('user-updated', ['userId' => 42]);

        // 3. Trigger Seamless SPA Redirect
        LiveResponse::redirect('/dashboard');

        // 4. Dynamically Set Page Title or Target Container
        LiveResponse::title('User Profile — Switch');
        LiveResponse::target('#profile-container');

        // 5. Preserve Scroll Position
        LiveResponse::preserveScroll(true);

        return view('partials.profile-card', ['user' => $user]);
    }
}
```

---

## 📡 Client-Side JavaScript Events

Listen for lifecycle events in your custom JavaScript scripts:

```javascript
// Before navigation starts
document.addEventListener('switch:live:start', (e) => {
    console.log('Navigating to:', e.detail.url);
});

// After DOM update succeeds
document.addEventListener('switch:live:success', (e) => {
    console.log('Successfully updated:', e.detail.url);
});

// When an error occurs
document.addEventListener('switch:live:error', (e) => {
    console.error('Request failed:', e.detail);
});

// Request lifecycle complete
document.addEventListener('switch:live:finish', (e) => {
    console.log('Finished navigation.');
});
```

---

## 🧪 Testing

Run the test suite with PHPUnit:

```bash
composer test
```

---

## 📄 License

The Switch Live package is open-source software licensed under the [MIT license](LICENSE).
