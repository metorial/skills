// Cloudflare Pages only serves static HTML for / and 404. This serves README.md at /
// and 404.md for missing files, as markdown for agents and as plain text for browsers.
let respond = (context: Parameters<PagesFunction>[0], body: string, status: number) => {
  let wantsHtml = (context.request.headers.get('accept') ?? '').includes('text/html');

  return new Response(body, {
    status,
    headers: {
      'content-type': wantsHtml ? 'text/plain; charset=utf-8' : 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  });
};

let readAsset = async (context: Parameters<PagesFunction>[0], path: string) => {
  let asset = await context.env.ASSETS.fetch(new URL(path, context.request.url));
  return asset.ok ? await asset.text() : null;
};

export let onRequest: PagesFunction = async context => {
  let url = new URL(context.request.url);

  if (url.pathname === '/') {
    let readme = await readAsset(context, '/README.md');
    if (readme) return respond(context, readme, 200);
  }

  let response = await context.next();
  if (response.status !== 404) return response;

  return respond(context, (await readAsset(context, '/404.md')) ?? '404: not found\n', 404);
};
