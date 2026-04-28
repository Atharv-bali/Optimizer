// Compiler implementation in JavaScript

class Token {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
}

class Node {
    constructor(type, value) {
        this.type = type;
        this.value = value;
        this.left = null;
        this.right = null;
    }
}

const keywords = new Set(['int', 'float']);

function isOperator(c) {
    return ['+', '-', '*', '/', '='].includes(c);
}

function isDelimiter(c) {
    return [';', '(', ')'].includes(c);
}

function tokenize(code) {
    const tokens = [];
    let i = 0;
    const n = code.length;

    while (i < n) {
        if (/\s/.test(code[i])) {
            i++;
            continue;
        }

        // Identifier or keyword
        if (/[a-zA-Z]/.test(code[i])) {
            let word = '';
            while (i < n && /[a-zA-Z0-9_]/.test(code[i])) {
                word += code[i++];
            }
            if (keywords.has(word)) {
                tokens.push(new Token('KEYWORD', word));
            } else {
                tokens.push(new Token('IDENTIFIER', word));
            }
        }
        // Number
        else if (/\d/.test(code[i])) {
            let num = '';
            while (i < n && /\d/.test(code[i])) {
                num += code[i++];
            }
            tokens.push(new Token('NUMBER', num));
        }
        // Operator
        else if (isOperator(code[i])) {
            tokens.push(new Token('OPERATOR', code[i]));
            i++;
        }
        // Delimiter
        else if (isDelimiter(code[i])) {
            tokens.push(new Token('DELIMITER', code[i]));
            i++;
        }
        else {
            i++;
        }
    }

    tokens.push(new Token('END', 'EOF'));
    return tokens;
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
        this.symbolTable = {};
    }

    current() {
        return this.tokens[this.pos];
    }

    advance() {
        if (this.pos < this.tokens.length) {
            this.pos++;
        }
    }

    expect(val) {
        if (this.current().value !== val) {
            throw new Error(`Expected ${val}, got ${this.current().value}`);
        }
        this.advance();
    }

    parseFactor() {
        const t = this.current();

        if (t.type === 'NUMBER') {
            this.advance();
            return new Node('NUM', t.value);
        }

        if (t.type === 'IDENTIFIER') {
            this.advance();
            return new Node('ID', t.value);
        }

        if (t.value === '(') {
            this.advance();
            const node = this.parseExpression();
            this.expect(')');
            return node;
        }

        throw new Error('Invalid factor');
    }

    parseTerm() {
        let node = this.parseFactor();

        while (this.current().value === '*' || this.current().value === '/') {
            const op = this.current().value;
            this.advance();
            const right = this.parseFactor();
            const newNode = new Node('OP', op);
            newNode.left = node;
            newNode.right = right;
            node = newNode;
        }

        return node;
    }

    parseExpression() {
        let node = this.parseTerm();

        while (this.current().value === '+' || this.current().value === '-') {
            const op = this.current().value;
            this.advance();
            const right = this.parseTerm();
            const newNode = new Node('OP', op);
            newNode.left = node;
            newNode.right = right;
            node = newNode;
        }

        return node;
    }

    parseDeclaration() {
        const type = this.current().value;
        this.advance();

        const varName = this.current().value;
        this.advance();

        this.expect('=');

        const expr = this.parseExpression();

        this.expect(';');

        const decl = new Node('DECL', varName);
        decl.left = expr;

        return decl;
    }

    parseProgram() {
        const program = [];

        while (this.current().type !== 'END') {
            if (this.current().type === 'KEYWORD') {
                program.push(this.parseDeclaration());
            } else {
                throw new Error('Invalid statement');
            }
        }

        return program;
    }

    evaluate(node) {
        if (!node) return 0;

        if (node.type === 'NUM') {
            return parseInt(node.value);
        }

        if (node.type === 'ID') {
            if (!(node.value in this.symbolTable)) {
                throw new Error(`Variable ${node.value} not declared`);
            }
            return this.symbolTable[node.value].value;
        }

        if (node.type === 'OP') {
            const left = this.evaluate(node.left);
            const right = this.evaluate(node.right);

            switch (node.value) {
                case '+': return left + right;
                case '-': return left - right;
                case '*': return left * right;
                case '/': return Math.floor(left / right);
            }
        }

        return 0;
    }

    buildSymbolTable(program) {
        for (const stmt of program) {
            const varName = stmt.value;

            if (varName in this.symbolTable) {
                throw new Error(`Variable ${varName} already declared`);
            }

            const value = this.evaluate(stmt.left);

            this.symbolTable[varName] = {
                type: 'int',
                value: value,
                initialized: true
            };
        }
    }
}

class TACGenerator {
    constructor() {
        this.tempCount = 1;
        this.instructions = [];
    }

    newTemp() {
        return 't' + this.tempCount++;
    }

    generate(node) {
        if (!node) return '';

        if (node.type === 'NUM' || node.type === 'ID') {
            return node.value;
        }

        if (node.type === 'OP') {
            const left = this.generate(node.left);
            const right = this.generate(node.right);
            const temp = this.newTemp();

            this.instructions.push({
                result: temp,
                arg1: left,
                op: node.value,
                arg2: right
            });

            return temp;
        }

        return '';
    }

    generateStatement(stmt) {
        const result = this.generate(stmt.left);
        this.instructions.push({
            result: stmt.value,
            arg1: result,
            op: '',
            arg2: ''
        });
    }

    generateProgram(program) {
        this.instructions = [];
        for (const stmt of program) {
            this.generateStatement(stmt);
        }
        return this.instructions;
    }
}

// Optimization functions
function isNumber(s) {
    return /^\d+$/.test(s);
}

function calculateRuntime(tac) {
    let runtime = 0;
    for (const t of tac) {
        if (t.op === '') {
            runtime += 1;
        } else if (t.op === '+' || t.op === '-') {
            runtime += 2;
        } else if (t.op === '*') {
            runtime += 3;
        } else if (t.op === '/') {
            runtime += 4;
        }
    }
    return runtime;
}

function constantFolding(tac) {
    const result = JSON.parse(JSON.stringify(tac));
    
    for (const t of result) {
        if (isNumber(t.arg1) && isNumber(t.arg2) && t.op) {
            const a = parseInt(t.arg1);
            const b = parseInt(t.arg2);
            let res;

            switch (t.op) {
                case '+': res = a + b; break;
                case '-': res = a - b; break;
                case '*': res = a * b; break;
                case '/': res = Math.floor(a / b); break;
                default: continue;
            }

            t.arg1 = res.toString();
            t.arg2 = '';
            t.op = '';
        }
    }

    return result;
}

function constantPropagation(tac) {
    const result = JSON.parse(JSON.stringify(tac));
    const constants = {};

    for (const t of result) {
        if (t.op === '' && isNumber(t.arg1)) {
            constants[t.result] = t.arg1;
        }

        if (constants[t.arg1]) {
            t.arg1 = constants[t.arg1];
        }

        if (constants[t.arg2]) {
            t.arg2 = constants[t.arg2];
        }
    }

    return result;
}

function deadCodeElimination(tac) {
    const used = new Set();
    const result = [];

    for (let i = tac.length - 1; i >= 0; i--) {
        if (used.has(tac[i].result) || i === tac.length - 1) {
            result.push(tac[i]);
            used.add(tac[i].arg1);
            used.add(tac[i].arg2);
        }
    }

    return result.reverse();
}

function commonSubexpression(tac) {
    const result = JSON.parse(JSON.stringify(tac));
    const expr = {};

    for (const t of result) {
        if (t.op !== '') {
            const key = t.arg1 + t.op + t.arg2;

            if (expr[key]) {
                t.op = '';
                t.arg1 = expr[key];
                t.arg2 = '';
            } else {
                expr[key] = t.result;
            }
        }
    }

    return result;
}
