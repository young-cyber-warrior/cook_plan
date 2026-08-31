const SCHEME = 'myapp';
const ANDROID_PACKAGE = 'com.anonymous.myapp';
const TARGETS = new Set(['invite', 'recipe']);
const TOKEN_PATTERN = /^[a-f0-9]{16,128}$/;

Deno.serve(req => {
  const segments = new URL(req.url).pathname.split('/').filter(Boolean);
  const token = segments.at(-1) ?? '';
  const target = segments.at(-2) ?? '';

  if (!TARGETS.has(target) || !TOKEN_PATTERN.test(token)) {
    return new Response('Not found', { status: 404 });
  }

  const isAndroid = /Android/i.test(req.headers.get('user-agent') ?? '');
  const location = isAndroid
    ? `intent://${target}/${token}#Intent;scheme=${SCHEME};package=${ANDROID_PACKAGE};end`
    : `${SCHEME}://${target}/${token}`;

  return new Response(null, {
    status: 302,
    headers: { location, 'cache-control': 'no-store' },
  });
});
