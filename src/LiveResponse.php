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
     * Send a Live response header set.
     */
    public static function setHeaders(?string $title = null, ?string $target = null): void
    {
        header('X-Switch-Live: 1');
        if ($title !== null) {
            header('X-Switch-Title: ' . $title);
        }
        if ($target !== null) {
            header('X-Switch-Target: ' . $target);
        }
    }
}
