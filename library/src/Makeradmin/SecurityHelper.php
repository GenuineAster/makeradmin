<?php
namespace Makeradmin;

use Laravel\Lumen\Application;
use Makeradmin\Libraries\CurlBrowser;

/**
 * Help functions to manage route permissions.
 */
class SecurityHelper {
	const PERMISSION_PREFIX = 'permission';
	const PREFIX_LENGTH = 10;

	public static function checkRoutePermissions(Application $app) {

		$used_permissions = [];
		$succeeded = true;
		$info = [];
		$routes = $app->router->getRoutes();
		foreach ($routes as $uri => $object) {
			$action = $object['action'];
			if (array_key_exists('middleware', $action) && !empty($middlwares = $action['middleware'])) {
				$permission_count = 0;
				foreach ($middlwares as $middleware_str) {
					if (strncmp($middleware_str, self::PERMISSION_PREFIX, self::PREFIX_LENGTH) === 0) {
						$permission_count++;
						$required_permission = substr($middleware_str, self::PREFIX_LENGTH + 1);
						$used_permissions[] = $required_permission;
						$info[] = "{$uri} requires permission: {$required_permission}";
					}
				}
				if ($permission_count == 0) {
					$succeeded = false;
					$info[] = "Error {$uri} does not require any permission";
				}
			} else {
				$succeeded = false;
				$info[] = "Error {$uri} does not require any permission";
			}
		}
		$result = [
			'succeeded' => $succeeded,
			'info' => $info,
			'permissions' => array_unique($used_permissions, SORT_STRING),
		];
		return $result;
	}

	/**
	 * Add user_id and permissions headers to CurlBrowser
	 */
	public static function addPermissionHeaders(CurlBrowser $ch, $user_id, $signed_user_permissions = '') {
		$ch->setHeader("X-User-Id", $user_id);
		$ch->setHeader("X-User-Permissions", $signed_user_permissions);
	}

	/**
	 * Add unauthorized user headers
	 */
	public static function addPermissionHeadersUnauthorized(CurlBrowser $ch) {
		$ch->setHeader("X-User-Id", 0);
		$ch->setHeader("X-User-Permissions", '');
	}

	public static function signPermissionString($permissions, $signing_token){
		return $permissions;
	}

	public static function verifyPermissionString($permissions, $signing_token){
		return true;
	}
}