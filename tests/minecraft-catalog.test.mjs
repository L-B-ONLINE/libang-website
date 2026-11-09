import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMinecraftCatalog, loadMinecraftVersion, officialArticleUrl, isOfficialMetadataUrl, officialMinecraftImage, minecraftUpdateName, fetchMinecraftJson, MANIFEST_URL, NEWS_URL } from '../lib/minecraft-data.ts';
import { versionChannel } from '../lib/minecraft-catalog.ts';

const hash = 'a'.repeat(40);
const manifest = () => ({ latest: { release: '26.3', snapshot: '26.4-snapshot-7' }, versions: [
  { id: '26.3', type: 'release', releaseTime: '2026-09-01T12:00:00Z', url: `https://piston-meta.mojang.com/v1/packages/${hash}/26.3.json` },
  { id: '26.4-snapshot-7', type: 'snapshot', releaseTime: '2026-11-03T13:08:56Z', url: `https://piston-meta.mojang.com/v1/packages/${hash}/26.4-snapshot-7.json` },
] });
const news = { entries: [{ id: '26-3', version: '26.3', title: 'Minecraft: Java Edition 26.3', type: 'release', date: '2026-09-01T12:00:00Z', shortText: 'Official short introduction.', image: { url: '/v2/images/26-3.jpg', title: 'Official artwork' } }] };

test('catalog sorts official versions and keeps internal metadata URLs server-side', async () => {
  const calls = [];
  const catalog = await loadMinecraftCatalog(async (url, options) => {
    calls.push(url); assert.equal(options.cf.cacheTtlByStatus['200-299'], 1800);
    assert.equal(options.redirect, 'manual'); assert.ok(options.signal);
    return Response.json(url === MANIFEST_URL ? manifest() : news);
  });
  assert.deepEqual(new Set(calls), new Set([MANIFEST_URL, NEWS_URL]));
  assert.equal(catalog.versions[0].id, '26.4-snapshot-7');
  assert.equal(catalog.versions[0].url, undefined);
  assert.equal(catalog.news[0].url, 'https://www.minecraft.net/en-us/article/minecraft-java-edition-26-3');
  assert.equal(catalog.news[0].updateName, 'Wilderness Bound');
  assert.equal(catalog.versions.find(version => version.id === '26.3').image.url, 'https://launchercontent.mojang.com/v2/images/26-3.jpg');
  assert.equal(catalog.versionsAvailable, true); assert.equal(catalog.newsAvailable, true);
});

test('news and version outages are independent, including malformed provider data', async () => {
  for (const failed of [MANIFEST_URL, NEWS_URL]) {
    const catalog = await loadMinecraftCatalog(async url => Response.json(url === failed ? {} : url === MANIFEST_URL ? manifest() : news));
    assert.equal(catalog.versionsAvailable, failed !== MANIFEST_URL);
    assert.equal(catalog.newsAvailable, failed !== NEWS_URL);
  }
  const catalog = await loadMinecraftCatalog(async () => { throw new Error('offline'); });
  assert.equal(catalog.latest, null); assert.deepEqual(catalog.news, []);
});

test('the update archive retains older official entries for continuous scrolling', async () => {
  const archive = { entries: Array.from({ length: 65 }, (_, index) => ({ ...news.entries[0], id: `entry-${index}`, version: `test-${index}`, date: new Date(Date.UTC(2026, 0, index + 1)).toISOString() })) };
  const catalog = await loadMinecraftCatalog(async url => Response.json(url === MANIFEST_URL ? manifest() : archive));
  assert.equal(catalog.news.length, 65);
  assert.equal(catalog.news[0].id, 'entry-64');
  assert.equal(catalog.news.at(-1).id, 'entry-0');
});

test('unknown version does not construct or fetch an arbitrary URL', async () => {
  let calls = 0;
  assert.equal(await loadMinecraftVersion('https://example.invalid/', async () => { calls++; return Response.json(manifest()); }), null);
  assert.equal(calls, 1);
});

test('metadata sources reject untrusted origins and redirects', () => {
  assert.equal(isOfficialMetadataUrl(manifest().versions[0].url), true);
  for (const url of [
    `https://evil.example/v1/packages/${hash}/26.3.json`,
    `https://piston-meta.mojang.com.evil.example/v1/packages/${hash}/26.3.json`,
    `http://piston-meta.mojang.com/v1/packages/${hash}/26.3.json`,
    `https://piston-meta.mojang.com/v1/packages/${hash}/26.3.json?redirect=evil`,
    `https://user:pass@piston-meta.mojang.com/v1/packages/${hash}/26.3.json`,
  ]) assert.equal(isOfficialMetadataUrl(url), false, url);
});

test('version metadata checks the version and server artifact checksum URL', async () => {
  const run = async overrides => loadMinecraftVersion('26.3', async url => Response.json(url === MANIFEST_URL ? manifest() : {
    id: '26.3', javaVersion: { majorVersion: 25 },
    downloads: { server: { url: `https://piston-data.mojang.com/v1/objects/${hash}/server.jar`, sha1: hash, size: 5000 } }, ...overrides,
  }));
  const valid = await run({}); assert.equal(valid.javaVersion, 25); assert.ok(valid.download);
  await assert.rejects(run({ id: 'some-other-version' }), /mismatch/);
  const unsafe = await run({ downloads: { server: { url: 'https://evil.example/server.jar', sha1: hash, size: 1 } } });
  assert.equal(unsafe.download, null);
  const historical = await run({ javaVersion: undefined, downloads: undefined });
  assert.equal(historical.download, null); assert.equal(historical.javaVersion, null);
});

test('oversized, failed or invalid JSON responses are rejected', async () => {
  await assert.rejects(fetchMinecraftJson(MANIFEST_URL, async () => new Response('x'.repeat(2 * 1024 * 1024 + 1))), /too large/);
  await assert.rejects(fetchMinecraftJson(MANIFEST_URL, async () => new Response('no', { status: 503 })), /unavailable/);
  await assert.rejects(fetchMinecraftJson(MANIFEST_URL, async () => new Response(null, { status: 302, headers: { location: 'https://evil.example/' } })), /unavailable/);
  await assert.rejects(fetchMinecraftJson(MANIFEST_URL, async () => new Response('<html>error</html>')));
});

test('version channels distinguish prereleases, candidates and historical editions', () => {
  for (const id of ['1.21-pre1', '1.21-rc1', '26.3-pre-3', '26.3-rc-3']) assert.equal(versionChannel({ id, type: 'snapshot' }), 'preview');
  assert.equal(versionChannel({ id: '26.4-snapshot-7', type: 'snapshot' }), 'snapshot');
  assert.equal(versionChannel({ id: '24w03b', type: 'snapshot' }), 'snapshot');
  assert.equal(versionChannel({ id: 'b1.7.3', type: 'old_beta' }), 'beta');
  assert.equal(versionChannel({ id: 'a1.2.6', type: 'old_alpha' }), 'alpha');
  assert.equal(versionChannel({ id: 'c0.30_01c', type: 'old_alpha' }), 'classic');
  assert.equal(versionChannel({ id: 'inf-20100618', type: 'old_alpha' }), 'infdev');
  assert.equal(versionChannel({ id: 'rd-132211', type: 'old_alpha' }), 'preclassic');
});

test('game-drop names preserve known releases and do not invent names for future versions', () => {
  for (const id of ['26.3', '26.3-pre-1', '26.3-rc-3']) assert.equal(minecraftUpdateName(id), 'Wilderness Bound');
  assert.equal(minecraftUpdateName('26.1.2'), 'Tiny Takeover');
  assert.equal(minecraftUpdateName('1.21.10'), 'The Copper Age');
  assert.equal(minecraftUpdateName('1.21.5'), 'Spring to Life');
  assert.equal(minecraftUpdateName('1.20.6'), 'Armored Paws');
  assert.equal(minecraftUpdateName('26.4-snapshot-7'), null);
  assert.equal(minecraftUpdateName('c0.30_01c'), null);
});

test('official artwork accepts publisher image paths and rejects external or script URLs', () => {
  assert.equal(officialMinecraftImage('/v2/images/26-3.jpg', 'Official').url, 'https://launchercontent.mojang.com/v2/images/26-3.jpg');
  for (const url of ['https://evil.example/v2/images/test.jpg', '//evil.example/test.jpg', 'javascript:alert(1)', '/v2/images/test.svg', 'https://launchercontent.mojang.com/v2/images/test.jpg?redirect=evil']) assert.equal(officialMinecraftImage(url, 'Official'), null);
});

test('official article links support old and new version naming', () => {
  for (const [id, suffix] of [['26.4-snapshot-7', 'minecraft-26-4-snapshot-7'], ['24w03b', 'minecraft-snapshot-24w03b'], ['1.21-pre1', 'minecraft-1-21-pre-release-1'], ['26.3-rc-3', 'minecraft-26-3-release-candidate-3']]) {
    assert.equal(officialArticleUrl(id, 'snapshot'), `https://www.minecraft.net/en-us/article/${suffix}`);
  }
  assert.equal(officialArticleUrl('<script>', 'release'), 'https://www.minecraft.net/en-us/updates');
});
