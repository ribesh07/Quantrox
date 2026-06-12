#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const message = [`Command failed: ${command} ${args.join(' ')}`];
    if (result.stdout) message.push(`stdout:\n${result.stdout}`);
    if (result.stderr) message.push(`stderr:\n${result.stderr}`);
    const error = new Error(message.join('\n\n'));
    error.code = result.status;
    throw error;
  }

  return result.stdout;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function normalizeSchema(schema) {
  const withoutComments = schema
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const withoutBlocks = withoutComments
    .split(/\r?\n/)
    .reduce((result, line) => {
      const trimmed = line.trim();
      const isBlockStart = /^(datasource|generator)\b/.test(trimmed);
      if (result.skipping) {
        result.depth += (line.match(/\{/g) || []).length;
        result.depth -= (line.match(/\}/g) || []).length;
        if (result.depth <= 0) {
          result.skipping = false;
        }
        return result;
      }

      if (isBlockStart && trimmed.endsWith('{')) {
        result.skipping = true;
        result.depth = 1;
        return result;
      }

      if (isBlockStart && trimmed.includes('{')) {
        result.skipping = true;
        result.depth = (trimmed.match(/\{/g) || []).length - (trimmed.match(/\}/g) || []).length;
        return result;
      }

      if (!result.skipping) {
        result.lines.push(line);
      }
      return result;
    }, { skipping: false, depth: 0, lines: [] })
    .lines
    .join('\n');

  return withoutBlocks
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter((line) => line.length > 0)
    .join('\n')
    .trim();
}

function writeTempSchema(content, destination) {
  fs.writeFileSync(destination, content, 'utf8');
}

function formatSchemaFile(schemaPath) {
  runCommand('npx', ['prisma', 'format', '--schema', schemaPath]);
  return fs.readFileSync(schemaPath, 'utf8');
}

function createUnifiedDiff(a, b, aLabel, bLabel) {
  const aLines = a.split(/\r?\n/);
  const bLines = b.split(/\r?\n/);
  const diffLines = [`--- ${aLabel}`, `+++ ${bLabel}`];
  const maxLines = Math.max(aLines.length, bLines.length);

  for (let i = 0; i < maxLines; i += 1) {
    const aLine = aLines[i];
    const bLine = bLines[i];
    if (aLine === bLine) {
      diffLines.push(` ${aLine ?? ''}`);
    } else {
      if (typeof aLine !== 'undefined') diffLines.push(`-${aLine}`);
      if (typeof bLine !== 'undefined') diffLines.push(`+${bLine}`);
    }
  }

  return diffLines.join('\n');
}

function fail(message) {
  console.error('[verify-prisma-baseline] ERROR:', message);
  process.exit(1);
}

(async () => {
  const projectRoot = process.cwd();
  const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');

  if (!fs.existsSync(schemaPath)) {
    fail(`Local Prisma schema not found at ${schemaPath}`);
  }

  console.log('[verify-prisma-baseline] Pulling current database schema for deterministic verification...');
  let introspectedSchema;

  try {
    introspectedSchema = runCommand('npx', ['prisma', 'db', 'pull', '--print', '--schema', schemaPath]);
  } catch (error) {
    fail(`Unable to introspect database schema. ${error.message}`);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prisma-baseline-'));
  const localSchemaTemp = path.join(tmpDir, 'local-schema.prisma');
  const introspectedSchemaTemp = path.join(tmpDir, 'introspected-schema.prisma');

  writeTempSchema(fs.readFileSync(schemaPath, 'utf8'), localSchemaTemp);
  writeTempSchema(introspectedSchema, introspectedSchemaTemp);

  let formattedLocal;
  let formattedIntrospected;

  try {
    formattedLocal = formatSchemaFile(localSchemaTemp);
    formattedIntrospected = formatSchemaFile(introspectedSchemaTemp);
  } catch (error) {
    fail(`Failed to format Prisma schema for comparison. ${error.message}`);
  }

  const canonicalLocal = normalizeSchema(formattedLocal);
  const canonicalIntrospected = normalizeSchema(formattedIntrospected);

  if (canonicalLocal !== canonicalIntrospected) {
    console.error('[verify-prisma-baseline] Local Prisma schema and database introspection do not match.');
    console.error('[verify-prisma-baseline] This deterministic verification prevents unsafe migration baselining.');
    console.error('\n[verify-prisma-baseline] Canonical schema diff:');
    console.error(createUnifiedDiff(canonicalLocal, canonicalIntrospected, 'local-schema', 'introspected-schema'));
    console.error('\n[verify-prisma-baseline] Local schema SHA256:', sha256(canonicalLocal));
    console.error('[verify-prisma-baseline] Introspected schema SHA256:', sha256(canonicalIntrospected));
    process.exit(1);
  }

  console.log('[verify-prisma-baseline] Deterministic schema verification succeeded.');
  console.log('[verify-prisma-baseline] Schema SHA256:', sha256(canonicalLocal));
})();
