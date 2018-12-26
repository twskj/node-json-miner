# node-json-miner
json-miner extracts json(s) out of text dump


## Install
`npm install --save json-miner`

## Usage

```js
const json_miner = require("json-miner");
var obj = { "hello": "world", "embeded": '{"hello":"world"}'};
var text = `[Dec-25-2018 00:00:00] ${JSON.stringify(obj)} STATUS: OK, ${JSON.stringify(obj,null,2)}, Random suffix }`
var result = json_miner.dig(text);
console.log(result); // result is an array of string
```

### .dig(str [, return_index_mode])

- **str** `<string>` - String to be searched
- **return_index_mode** `boolean` - When set to `true` result will be in a form of [[start_index,end_index]]. default to `false`