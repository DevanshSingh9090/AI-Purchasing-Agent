// Tiny, dependency-free test runner. Deliberately not Jest/Mocha — the brief says not to
// over-build Phase 6, and a plain async test()/assert() pair is enough for 6 test cases.

const results = [];

async function test(name, fn) {
  const start = Date.now();
  try {
    const details = (await fn()) || {};
    results.push({ name, status: 'PASS', durationMs: Date.now() - start, details });
    console.log(`✅ PASS  ${name}`);
  } catch (err) {
    results.push({ name, status: 'FAIL', durationMs: Date.now() - start, error: err.message, details: err.details || {} });
    console.log(`❌ FAIL  ${name}`);
    console.log(`   ${err.message}`);
  }
}

function assert(condition, message, details) {
  if (!condition) {
    const err = new Error(message);
    err.details = details;
    throw err;
  }
}

function summary() {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  return { passed, failed, total: results.length, results };
}

function toMarkdown() {
  const { passed, failed, total } = summary();
  let md = `# Evaluation Report\n\nGenerated: ${new Date().toISOString()}\n\n`;
  md += `**${passed}/${total} passed**${failed ? `, ${failed} failed` : ''}.\n\n`;

  for (const r of results) {
    md += `## ${r.status === 'PASS' ? '✅' : '❌'} ${r.name}\n\n`;
    md += `- Status: **${r.status}**\n- Duration: ${r.durationMs}ms\n`;
    if (r.error) md += `- Error: ${r.error}\n`;
    if (r.details && Object.keys(r.details).length) {
      md += `- Details:\n\n\`\`\`json\n${JSON.stringify(r.details, null, 2)}\n\`\`\`\n`;
    }
    md += `\n`;
  }
  return md;
}

module.exports = { test, assert, summary, toMarkdown, results };