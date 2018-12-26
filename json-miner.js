function getInitialState() {
    return {
        tokens: []
        , context: []
        , inQuote: false
        , jsonIdx: -1
        , quoteIdx: -1
    };
}

function popUntil(stack, val) {
    var i = stack.length - 1;
    while (i > -1) {
        if (val === stack[i]) {
            stack.length = i;
            return;
        }
        i--;
    }
}


function extractJSONs(str, returnIndex) {
    var jsons = [];
    if (!str) {
        return jsons;
    }
    var numbers = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'])
    var state = getInitialState();

    for (var i = 0; i < str.length; i++) {
        ch = str[i];

        if (state.inQuote) {
            if (ch === '"') {
                state.inQuote = false;
                state.tokens.push('v');
            }
            else if (ch === '\\') {
                i++;
            }
            continue;
        }
        if (ch === "\n" || ch === " " || ch === "\t" || ch == "\r") {
            continue;
        }
        if (state.context.length === 0 && (ch === '{' || ch === '[')) {
            state.tokens.push(ch);
            state.context.push(ch === "{" ? 'o' : 'a');
            if (state.jsonIdx === -1) {
                state.jsonIdx = i;
            }
            continue;
        }
        if (!state.context.length) {
            continue;
        }

        var context = state.context[state.context.length - 1];
        if (ch === '"') {
            state.inQuote = true;
            state.quoteIdx = i;
            continue;
        }
        else if (ch === ",") {
            // comma is valid in context of array and object
            if (state.tokens[state.tokens.length - 1] === 'v'
                && (state.tokens[state.tokens.length - 2] === ':'
                    || state.tokens[state.tokens.length - 2] === ','
                    || state.tokens[state.tokens.length - 2] === '['
                )) {
                state.tokens.push(',');
                continue;
            }
        }
        else if (ch === ":") {
            if (state.tokens[state.tokens.length - 1] === 'v' && context === 'o') {
                state.tokens.push(':');
                continue;
            }
        }

        // ok as value
        else if (ch === "{") {
            if (state.tokens[state.tokens.length - 1] === ':' // expecting value --> ok
                || (state.tokens[state.tokens.length - 1] === ',' // if previous is comma make sure it is not expecting key
                    && (state.tokens[state.tokens.length - 3] === ',' || state.tokens[state.tokens.length - 3] === '['))
                || state.tokens[state.tokens.length - 1] === '['
            ) {
                state.tokens.push('{');
                state.context.push('o');
                continue;
            }
        }

        else if (ch === "[") {
            if (state.tokens[state.tokens.length - 1] === ':' // expecting value --> ok
                || (state.tokens[state.tokens.length - 1] === ',' // if previous is comma make sure it is not expecting key
                    && (state.tokens[state.tokens.length - 3] === ',' || state.tokens[state.tokens.length - 3] === '['))
                || state.tokens[state.tokens.length - 1] === '['
            ) {
                state.tokens.push('[');
                state.context.push('a');
                continue;
            }
        }
        else if (ch === "}") {
            if (state.tokens[state.tokens.length - 1] === '{'
                || (state.tokens[state.tokens.length - 1] === 'v' && state.tokens[state.tokens.length - 2] === ':')) {
                popUntil(state.tokens, '{');
                state.context.pop();
                if (state.tokens.length === 0) {
                    if (returnIndex) {
                        jsons.push([state.jsonIdx, i]);
                    }
                    else {
                        jsons.push(str.substr(state.jsonIdx, i - state.jsonIdx + 1));
                    }
                    state.jsonIdx = -1
                }
                else {
                    state.tokens.push('v');
                }
                continue;
            }
        }

        else if (ch === "]") {
            if (state.tokens[state.tokens.length - 1] === '['
                || (state.tokens[state.tokens.length - 1] === 'v'
                    && (state.tokens[state.tokens.length - 2] === ',' || state.tokens[state.tokens.length - 2] === '['))) {
                popUntil(state.tokens, '[');
                state.context.pop();
                if (state.tokens.length === 0) {
                    if (returnIndex) {
                        jsons.push([state.jsonIdx, i]);
                    }
                    else {
                        jsons.push(str.substr(state.jsonIdx, i - state.jsonIdx + 1));
                    }
                    state.jsonIdx = -1;
                }
                else {
                    state.tokens.push('v');
                }
                continue;
            }
        }

        else if (ch === "n") {
            //null
            if (str[i + 1] === "u" && str[i + 2] === "l" && str[i + 3] === "l") {
                state.tokens.push('v');
                i += 3;
                continue;
            }
        }
        else if (ch === "t") {
            //true
            if (str[i + 1] === "r" && str[i + 2] === "u" && str[i + 3] === "e") {
                state.tokens.push('v');
                i += 3;
                continue;
            }
        }
        else if (ch === "f") {
            //false
            if (str[i + 1] === "a" && str[i + 2] === "l" && str[i + 3] === "s" && str[i + 4] === "e") {
                state.tokens.push('v');
                i += 4;
                continue;
            }
        }
        else if ((ch === "-" || numbers.has(ch))
            && (state.tokens[state.tokens.length - 1] === ':' // expecting value --> ok
                || (state.tokens[state.tokens.length - 1] === ',' // if previous is comma make sure it is not expecting key
                    && (state.tokens[state.tokens.length - 3] === ',' || state.tokens[state.tokens.length - 3] === '[')
                ))) {
            var expectDacimal = false;
            var expectNumber = ch === '-';
            var seenDot = false;

            for (var j = i + 1; j < str.length; j++) {
                if (numbers.has(str[j])) {
                    i = j;
                    if (expectNumber) {
                        expectNumber = false;
                    }
                    else if (expectDacimal) {
                        expectDacimal = false;
                    }
                    continue;
                }
                else if (str[j] === '.') {
                    i = j
                    expectDacimal = true;
                    if (seenDot) {
                        break;
                    }
                    seendot = true;
                    continue;
                }
                break;
            }
            if (!expectNumber && !expectDacimal) {
                state.tokens.push('v');
                continue;
            }
        }

        // invalid token at this point
        // reset state and move on
        if (state.inQuote) {
            i = state.quoteIdx;
        }
        state = getInitialState();
    }
    return jsons;
}

module.exports = {
    dig: extractJSONs
}