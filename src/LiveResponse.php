<?php

declare(strict_types=1);

namespace Switch\Live;

class LiveResponse
{
    /**
     * Check if the current incoming HTTP request is a Switch Live request.
     */
    public static function isLiveRequest(): bool
    {
        if (isset($_SERVER['HTTP_X_SWITCH_LIVE']) && $_SERVER['HTTP_X_SWITCH_LIVE'] === '1') {
            return true;
        }
        return false;
    }

    /**
     * Set a toast notification header.
     *
     * @param string $message Toast message
     * @param string $type Toast type ('success', 'error', 'warning', 'info')
     */
    public static function toast(string $message, string $type = 'info'): void
    {
        if (!headers_sent()) {
            @header('X-Switch-Live: 1');
            @header('X-Switch-Toast: ' . json_encode(['message' => $message, 'type' => $type], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        }
    }

    /**
     * Dispatch a custom client-side event.
     *
     * @param string $event Event name
     * @param array<string, mixed> $detail Event payload
     */
    public static function emit(string $event, array $detail = []): void
    {
        if (!headers_sent()) {
            @header('X-Switch-Live: 1');
            @header('X-Switch-Event: ' . json_encode(['event' => $event, 'detail' => $detail], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        }
    }

    /**
     * Trigger a client-side seamless redirect.
     */
    public static function redirect(string $url): void
    {
        if (!headers_sent()) {
            @header('X-Switch-Live: 1');
            @header('X-Switch-Redirect: ' . $url);
        }
    }

    /**
     * Set target DOM container selector for response rendering.
     */
    public static function target(string $target): void
    {
        if (!headers_sent()) {
            @header('X-Switch-Live: 1');
            @header('X-Switch-Target: ' . $target);
        }
    }

    /**
     * Set dynamic document title for the page.
     */
    public static function title(string $title): void
    {
        if (!headers_sent()) {
            @header('X-Switch-Live: 1');
            @header('X-Switch-Title: ' . $title);
        }
    }

    /**
     * Tell the client to preserve the current scroll position.
     */
    public static function preserveScroll(bool $preserve = true): void
    {
        if ($preserve && !headers_sent()) {
            @header('X-Switch-Live: 1');
            @header('X-Switch-Scroll: preserve');
        }
    }

    /**
     * Send a standard Live response header set.
     */
    public static function setHeaders(?string $title = null, ?string $target = null): void
    {
        if (!headers_sent()) {
            @header('X-Switch-Live: 1');
            if ($title !== null) {
                @header('X-Switch-Title: ' . $title);
            }
            if ($target !== null) {
                @header('X-Switch-Target: ' . $target);
            }
        }
    }
}
