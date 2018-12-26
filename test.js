'use strict';

const assert = require("assert");
const json_miner = require("./json-miner");

var obj = { "hello": "world", "embeded": '{"hello":"world"}' };
var dump = `  PREFIX  ${JSON.stringify(obj)}          BETWEEN 
${JSON.stringify(obj, null, 4)} SUFFIX

{invalid:json} [{}]`;

var result = json_miner.dig(dump);
assert.strictEqual(result.length, 3, "Incorrect JSONs number captured #1");
assert.deepEqual(result[0], JSON.stringify(obj), "Capture wrong payload #1");
assert.deepEqual(JSON.parse(result[1]), obj, "Capture wrong payload #2");
assert.deepEqual(result[2], "[{}]", "Capture wrong payload #3");

result = json_miner.dig(dump, true);
assert.strictEqual(result.length, 3, "Incorrect JSONs number captured #2");
assert.deepEqual(dump.substr(result[0][0], result[0][1] - result[0][0] + 1), JSON.stringify(obj), "Capture wrong payload #4");
assert.deepEqual(JSON.parse(dump.substr(result[1][0], result[1][1] - result[1][0] + 1)), obj, "Capture wrong payload #5");
assert.deepEqual(dump.substr(result[2][0], result[2][1] - result[2][0] + 1), "[{}]", "Capture wrong payload #6");

console.log("\x1b[32m%s\x1b[0m", "ALL OK");
