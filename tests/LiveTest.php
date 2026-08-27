<?php

declare(strict_types=1);

namespace Switch\Live\Tests;

use PHPUnit\Framework\TestCase;
use Switch\Live\LiveResponse;
use Switch\Live\LiveScript;
use Switch\Live\Middleware\LiveMiddleware;
use Switch\Http\ServerRequest;
use Switch\Http\Response;

require_once __DIR__ . '/../src/helpers.php';

class LiveTest extends TestCase
{
    public function testLiveScriptRenderContainsJSContent(): void
    {
        $html = LiveScript::render(true);
        $this->assertStringContainsString('<script>', $html);
        $this->assertStringContainsString('SwitchLive', $html);
        $this->assertStringContainsString('switch-to', $html);
        $this->assertStringContainsString('switch-live-progress', $html);
        $this->assertStringContainsString('switch-poll', $html);
        $this->assertStringContainsString('switch-lazy', $html);
        $this->assertStringContainsString('switch-infinite', $html);
        $this->assertStringContainsString('handleFileUpload', $html);
        $this->assertStringContainsString('switch-upload', $html);
    }

    public function testGlobalLiveScriptsHelper(): void
    {
        $html = live_scripts();
        $this->assertStringContainsString('SwitchLive', $html);
    }

    public function testLiveResponseDetectsHeader(): void
    {
        $_SERVER['HTTP_X_SWITCH_LIVE'] = '1';
        $this->assertTrue(LiveResponse::isLiveRequest());
        $this->assertTrue(is_live());

        unset($_SERVER['HTTP_X_SWITCH_LIVE']);
        $this->assertFalse(LiveResponse::isLiveRequest());
        $this->assertFalse(is_live());
    }

    public function testLiveResponseHelperMethodsExecuteWithoutErrors(): void
    {
        // Suppress header already sent warning during CLI test execution
        @LiveResponse::toast('User saved successfully', 'success');
        @LiveResponse::emit('user-created', ['id' => 123]);
        @LiveResponse::redirect('/dashboard');
        @LiveResponse::target('#content');
        @LiveResponse::title('Dashboard — Switch');
        @LiveResponse::preserveScroll(true);
        @LiveResponse::setHeaders('New Title', '#app');

        $this->assertTrue(true);
    }

    public function testLiveMiddlewareAppendsHeaderOnLiveRequest(): void
    {
        $middleware = new LiveMiddleware();
        $request = (new ServerRequest('GET', '/users'))->withHeader('X-Switch-Live', '1');

        $handler = new class implements \Psr\Http\Server\RequestHandlerInterface {
            public function handle(\Psr\Http\Message\ServerRequestInterface $request): \Psr\Http\Message\ResponseInterface
            {
                return new Response(200, [], \Switch\Http\Stream::create('<h1>Users Page</h1>'));
            }
        };

        $response = $middleware->process($request, $handler);
        $this->assertTrue($response->hasHeader('X-Switch-Live'));
        $this->assertEquals('1', $response->getHeaderLine('X-Switch-Live'));
    }
}
