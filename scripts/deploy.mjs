import { execFileSync, execSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (args, cwd = root, capture = false) => execFileSync('git', args, {
  cwd, stdio: capture ? 'pipe' : 'inherit', encoding: 'utf8',
});
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const remote = git(['remote', 'get-url', 'origin'], root, true).trim();
const branch = spawnSync('git', ['ls-remote', '--exit-code', '--heads', remote, 'gh-pages'], { cwd: root });
if (branch.status !== 0 && branch.status !== 2) throw new Error('Cannot inspect the deployment branch. Check GitHub authentication.');

// Build in a separate clone so publishing never switches or cleans the source checkout.
const temporary = mkdtempSync(join(tmpdir(), 'nakram-pages-'));
const checkout = join(temporary, 'site');
if (!resolve(checkout).startsWith(resolve(temporary) + sep)) throw new Error('Invalid deployment directory');
try {
  git(['clone', '--depth', '1', '--single-branch', ...(branch.status === 0 ? ['--branch', 'gh-pages'] : []), remote, checkout]);
  if (branch.status === 2) git(['checkout', '--orphan', 'gh-pages'], checkout);
  git(['rm', '-r', '-f', '--ignore-unmatch', '--', '.'], checkout);
  cpSync(join(root, 'dist'), checkout, { recursive: true });
  git(['add', '--all'], checkout);
  const changed = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: checkout });
  if (changed.status === 0) console.log('The published build is already up to date.');
  else {
    if (changed.status !== 1) throw new Error('Cannot inspect the deployment changes');
    git(['commit', '-m', 'Deploy portfolio'], checkout);
    git(['push', 'origin', 'HEAD:gh-pages'], checkout);
  }
} finally {
  if (!resolve(temporary).startsWith(resolve(tmpdir()) + sep + 'nakram-pages-')) throw new Error('Invalid temporary cleanup directory');
  rmSync(temporary, { recursive: true, force: true });
}
