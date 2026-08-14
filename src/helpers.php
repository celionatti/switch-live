<?php

declare(strict_types=1);

use Switch\Live\LiveResponse;
use Switch\Live\LiveScript;

if (!function_exists('live_scripts')) {
    /**
     * Render the Switch Live client script tag.
     */
    function live_scripts(bool $inline = true): string
    {
        return LiveScript::render($inline);
    }
}

if (!function_exists('is_live')) {
    /**
     * Check if current request is a Switch Live AJAX request.
     */
    function is_live(): bool
    {
        return LiveResponse::isLiveRequest();
    }
}
