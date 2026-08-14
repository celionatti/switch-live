<?php

declare(strict_types=1);

namespace Switch\Live;

class LiveScript
{
    private static ?string $scriptContent = null;

    /**
     * Get the JS client script content.
     */
    public static function getScriptContent(): string
    {
        if (self::$scriptContent === null) {
            $file = __DIR__ . '/../resources/switch-live.js';
            self::$scriptContent = file_exists($file) ? file_get_contents($file) : '';
        }
        return self::$scriptContent;
    }

    /**
     * Render inline script or script tag for views.
     */
    public static function render(bool $inline = true): string
    {
        if ($inline) {
            return '<script>' . self::getScriptContent() . '</script>';
        }
        return '<script src="/switch-live.js" defer></script>';
    }
}
