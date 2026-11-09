#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pipeline } = require('node:stream/promises');

async function sha256(file) {
  const hash = crypto.createHash('sha256');
  for await (const block of fs.createReadStream(file)) hash.update(block);
  return hash.digest('hex');
}

async function main() {
  const args = process.argv.slice(2);
  const keysIndex = args.indexOf('--keys');
  const outputIndex = args.indexOf('--output');
  if (keysIndex < 0 || !args[keysIndex + 1]) {
    throw new Error('Usage: node restore-backup.cjs --keys /path/decryption-keys.json [--output /directory]');
  }
  const directory = __dirname;
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'verification.json'), 'utf8'));
  const keys = JSON.parse(fs.readFileSync(path.resolve(args[keysIndex + 1]), 'utf8'));
  const hexKey = keys.keys[manifest.project];
  if (typeof hexKey !== 'string' || !/^[a-f0-9]{64}$/.test(hexKey)) {
    throw new Error('The key file does not contain a valid key for this project.');
  }
  const outputDirectory = outputIndex < 0 ? process.cwd() : path.resolve(args[outputIndex + 1]);
  fs.mkdirSync(outputDirectory, { recursive: true });
  const checksums = fs.readFileSync(path.join(directory, 'SHA256SUMS'), 'utf8').trim().split(/\r?\n/);
  for (const line of checksums) {
    const match = /^([a-f0-9]{64})  (snapshot\.tar\.gz\.aes(?:\.part-\d{3})?)$/.exec(line);
    if (!match || await sha256(path.join(directory, match[2])) !== match[1]) {
      throw new Error('A backup file failed SHA-256 verification.');
    }
  }
  const full = path.join(directory, 'snapshot.tar.gz.aes');
  let encrypted = full;
  let temporary;
  let partial;
  try {
    if (!fs.existsSync(full)) {
      const parts = fs.readdirSync(directory).filter(name => /^snapshot\.tar\.gz\.aes\.part-\d{3}$/.test(name)).sort();
      if (!parts.length) throw new Error('No backup file found.');
      temporary = path.join(outputDirectory, '.snapshot-' + crypto.randomBytes(8).toString('hex') + '.aes');
      fs.closeSync(fs.openSync(temporary, 'wx'));
      for (const part of parts) {
        await pipeline(fs.createReadStream(path.join(directory, part)), fs.createWriteStream(temporary, { flags: 'a' }));
      }
      encrypted = temporary;
    }
    if (await sha256(encrypted) !== manifest.encrypted_sha256) {
      throw new Error('The complete encrypted archive failed SHA-256 verification.');
    }
    const header = Buffer.from('HWCLOUD-BACKUP-1\n');
    const size = fs.statSync(encrypted).size;
    const first = Buffer.alloc(header.length + 12);
    const tag = Buffer.alloc(16);
    const handle = fs.openSync(encrypted, 'r');
    try {
      fs.readSync(handle, first, 0, first.length, 0);
      fs.readSync(handle, tag, 0, tag.length, size - tag.length);
    } finally {
      fs.closeSync(handle);
    }
    if (!first.subarray(0, header.length).equals(header)) throw new Error('Invalid archive header.');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(hexKey, 'hex'), first.subarray(header.length));
    decipher.setAAD(header);
    decipher.setAuthTag(tag);
    const output = path.join(outputDirectory, manifest.project + '-20261109.tar.gz');
    if (fs.existsSync(output)) throw new Error('Output already exists: ' + output);
    partial = output + '.partial-' + crypto.randomBytes(8).toString('hex');
    await pipeline(
      fs.createReadStream(encrypted, { start: first.length, end: size - tag.length - 1 }),
      decipher,
      fs.createWriteStream(partial, { flags: 'wx', mode: 0o600 })
    );
    if (await sha256(partial) !== manifest.archive_sha256) throw new Error('The decrypted archive failed SHA-256 verification.');
    fs.renameSync(partial, output);
    partial = undefined;
    console.log('Authenticated decryption and SHA-256 verification passed.');
    console.log(output);
  } finally {
    if (temporary && fs.existsSync(temporary)) fs.unlinkSync(temporary);
    if (partial && fs.existsSync(partial)) fs.unlinkSync(partial);
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
