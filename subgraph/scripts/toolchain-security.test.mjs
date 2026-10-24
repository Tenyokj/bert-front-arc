import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const cliRoot = path.dirname(require.resolve("@graphprotocol/graph-cli/package.json"));
const cliRequire = createRequire(path.join(cliRoot, "package.json"));
const { default: decompress } = await import(pathToFileURL(cliRequire.resolve("decompress")));
const { extractZipAndGetExe } = await import(
  pathToFileURL(path.join(cliRoot, "dist/command-helpers/local-node.js"))
);

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Store-only ZIP fixtures let us test extraction without executing or downloading binaries.
function zip(entries) {
  const locals = [];
  const directory = [];
  let offset = 0;
  for (const { name, content, mode = 0o100644 } of entries) {
    const filename = Buffer.from(name);
    const bytes = Buffer.from(content);
    const checksum = crc32(bytes);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(bytes.length, 18);
    local.writeUInt32LE(bytes.length, 22);
    local.writeUInt16LE(filename.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(bytes.length, 20);
    central.writeUInt32LE(bytes.length, 24);
    central.writeUInt16LE(filename.length, 28);
    central.writeUInt32LE((mode << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    locals.push(local, filename, bytes);
    directory.push(central, filename);
    offset += local.length + filename.length + bytes.length;
  }
  const central = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, central, end]);
}

async function sandbox(t) {
  const root = await mkdtemp(path.join(tmpdir(), "bert-graph-security-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const output = path.join(root, "output");
  const outside = path.join(root, "outside");
  await mkdir(output);
  await mkdir(outside);
  const sentinel = path.join(outside, "sentinel.txt");
  await writeFile(sentinel, "unchanged");
  return { root, output, outside, sentinel };
}

test("Graph CLI resolves the reviewed maintained decompressor", async () => {
  const pkg = JSON.parse(await readFile(
    path.join(path.dirname(cliRequire.resolve("decompress")), "package.json"), "utf8"
  ));
  assert.equal(pkg.name, "@xhmikosr/decompress");
  assert.equal(pkg.version, "11.1.4");
});

test("actual Graph CLI helper extracts and selects the sole executable", async (t) => {
  const { root, output } = await sandbox(t);
  const archive = path.join(root, "valid.zip");
  await writeFile(archive, zip([
    { name: "bin/gnd.exe", content: "fixture, not a binary" },
    { name: "README.txt", content: "fixture" },
  ]));
  const executable = await extractZipAndGetExe(archive, output);
  assert.equal(executable, path.join(output, "bin/gnd.exe"));
  assert.equal(await readFile(executable, "utf8"), "fixture, not a binary");
});

test("actual Graph CLI helper refuses ambiguous executables", async (t) => {
  const { root, output } = await sandbox(t);
  const archive = path.join(root, "ambiguous.zip");
  await writeFile(archive, zip([
    { name: "one.exe", content: "one" },
    { name: "two.exe", content: "two" },
  ]));
  await assert.rejects(extractZipAndGetExe(archive, output), /Expected 1 executable/);
});

for (const attack of ["parent traversal", "absolute path", "symlink chain", "existing symlink"]) {
  test(`extraction cannot overwrite outside files via ${attack}`, async (t) => {
    const { output, outside, sentinel } = await sandbox(t);
    let entries;
    if (attack === "parent traversal") {
      entries = [{ name: "../outside/sentinel.txt", content: "tampered" }];
    } else if (attack === "absolute path") {
      entries = [{ name: sentinel, content: "tampered" }];
    } else if (attack === "symlink chain") {
      entries = [
        { name: "pivot", content: "..", mode: 0o120777 },
        { name: "chain", content: "pivot/outside", mode: 0o120777 },
        { name: "chain/sentinel.txt", content: "tampered" },
      ];
    } else {
      await symlink(outside, path.join(output, "pivot"));
      entries = [{ name: "pivot/sentinel.txt", content: "tampered" }];
    }
    // Both rejection and safe omission are valid. Any external write must fail the test.
    await decompress(zip(entries), output).catch(() => undefined);
    assert.equal(await readFile(sentinel, "utf8"), "unchanged");
  });
}
