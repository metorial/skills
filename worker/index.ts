interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

let respond = (request: Request, body: string, status: number) => {
  let wantsHtml = (request.headers.get('accept') ?? '').includes('text/html');

  return new Response(body, {
    status,
    headers: {
      'content-type': wantsHtml ? 'text/plain; charset=utf-8' : 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  });
};

let readAsset = async (env: Env, request: Request, path: string) => {
  let asset = await env.ASSETS.fetch(new Request(new URL(path, request.url)));
  return asset.ok ? await asset.text() : null;
};

// Only requests that match no static file reach this worker: "/" and missing paths.
export default {
  async fetch(request: Request, env: Env) {
    let url = new URL(request.url);

    if (url.pathname === '/') {
      let readme = await readAsset(env, request, '/README.md');
      if (readme) return respond(request, readme, 200);
    }

    let notFound = (await readAsset(env, request, '/404.md')) ?? '404: not found\n';
    return respond(request, notFound, 404);
  }
};
