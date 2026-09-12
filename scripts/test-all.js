import { spawnSync } from 'node:child_process';

const tests = [
  ['Neon PostgreSQL', 'scripts/test-neon.js'],
  ['Google Places  ', 'scripts/test-places.js'],
  ['OpenAI         ', 'scripts/test-openai.js'],
  ['Brevo          ', 'scripts/test-brevo.js'],
];

const results = [];
for (const [name, file] of tests) {
  console.log(`\n──── Testing ${name.trim()} ────`);
  const r = spawnSync('node', [file], { stdio: 'inherit' });
  results.push([name, r.status === 0]);
}

console.log('\n════════ SUMMARY ════════');
for (const [name, ok] of results) {
  console.log(`${ok ? '✅' : '❌'}  ${name}`);
}

const allOk = results.every(([, ok]) => ok);
console.log(allOk ? '\nAll four connections are working. Phase 0 is ready. 🎉' : '\nSome checks failed — fix the ❌ ones above and re-run.');
process.exit(allOk ? 0 : 1);
