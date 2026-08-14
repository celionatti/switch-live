<?php

declare(strict_types=1);

namespace Switch\Live\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class LiveMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $response = $handler->handle($request);

        if ($request->hasHeader('X-Switch-Live') || $request->hasHeader('x-switch-live')) {
            return $response->withHeader('X-Switch-Live', '1');
        }

        return $response;
    }
}
