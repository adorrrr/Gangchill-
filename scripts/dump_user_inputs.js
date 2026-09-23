const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/USER/.gemini/antigravity/brain/8932fdcd-53ae-457c-9aaf-78fbcd8ee27c/.system_generated/logs/transcript.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT') {
        const text = (obj.content || '').substring(0, 120).replace(/\r?\n/g, ' ');
        console.log('USER_INPUT #' + count++ + ' (step ' + obj.step_index + '): ' + text);
      }
    } catch (e) {}
  }
}
processLineByLine();
