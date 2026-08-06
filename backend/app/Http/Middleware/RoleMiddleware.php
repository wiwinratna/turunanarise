<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        // role is cast to a UserRole enum — extract the string value for comparison
        $roleValue = $user->role instanceof \BackedEnum ? $user->role->value : (string) $user->role;

        if (!$user || !in_array($roleValue, $roles)) {
            return response()->json([
                'message' => 'Forbidden: You do not have the required role (' . implode(', ', $roles) . ')'
            ], 403);
        }

        return $next($request);
    }
}
