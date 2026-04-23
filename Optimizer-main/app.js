// Main application logic

let currentTokens = [];
let currentAST = [];
let currentSymbolTable = {};
let currentTAC = [];

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// Load example code
document.getElementById('exampleBtn').addEventListener('click', () => {
    document.getElementById('codeInput').value = `int a = 3;
int b = 5;
int c = a * b + 2;
int d = a * b + 7;`;
});

// Compile button
document.getElementById('compileBtn').addEventListener('click', () => {
    const code = document.getElementById('codeInput').value.trim();
    
    if (!code) {
        alert('Please enter some code first!');
        return;
    }

    try {
        compile(code);
    } catch (error) {
        alert('Compilation Error: ' + error.message);
        console.error(error);
    }
});

function compile(code) {
    // Step 1: Tokenize
    currentTokens = tokenize(code);
    displayTokens(currentTokens);

    // Step 2: Parse
    const parser = new Parser(currentTokens);
    currentAST = parser.parseProgram();
    displayAST(currentAST);

    // Step 3: Build symbol table
    parser.buildSymbolTable(currentAST);
    currentSymbolTable = parser.symbolTable;
    displaySymbolTable(currentSymbolTable);

    // Step 4: Generate TAC
    const tacGen = new TACGenerator();
    currentTAC = tacGen.generateProgram(currentAST);
    displayTAC(currentTAC);

    // Step 5: Apply optimizations
    applyOptimizations(currentTAC);
}

function displayTokens(tokens) {
    const output = document.getElementById('tokensOutput');
    output.innerHTML = '';

    const tokenTypeMap = {
        'KEYWORD': 'token-keyword',
        'IDENTIFIER': 'token-identifier',
        'NUMBER': 'token-number',
        'OPERATOR': 'token-operator',
        'DELIMITER': 'token-delimiter'
    };

    tokens.forEach(token => {
        if (token.type !== 'END') {
            const badge = document.createElement('span');
            badge.className = `token-badge ${tokenTypeMap[token.type] || ''}`;
            badge.textContent = `${token.value} (${token.type})`;
            output.appendChild(badge);
        }
    });
}

function displayAST(ast) {
    const output = document.getElementById('astOutput');
    let result = '';

    ast.forEach((stmt, idx) => {
        result += `Statement ${idx + 1}: ${stmt.value}\n`;
        result += printNode(stmt.left, 1);
        result += '\n';
    });

    output.textContent = result || 'No AST generated';
}

function printNode(node, depth) {
    if (!node) return '';

    const indent = '  '.repeat(depth);
    let result = '';

    if (node.type === 'OP') {
        result += `${indent}${node.value}\n`;
        result += printNode(node.left, depth + 1);
        result += printNode(node.right, depth + 1);
    } else {
        result += `${indent}${node.type}: ${node.value}\n`;
    }

    return result;
}

function displaySymbolTable(symbolTable) {
    const output = document.getElementById('symbolOutput');
    
    let html = '<table class="symbol-table">';
    html += '<thead><tr><th>Variable</th><th>Type</th><th>Value</th><th>Initialized</th></tr></thead>';
    html += '<tbody>';

    for (const [name, symbol] of Object.entries(symbolTable)) {
        html += `<tr>
            <td><strong>${name}</strong></td>
            <td>${symbol.type}</td>
            <td>${symbol.value}</td>
            <td>${symbol.initialized ? '✓' : '✗'}</td>
        </tr>`;
    }

    html += '</tbody></table>';
    output.innerHTML = html;
}

function displayTAC(tac) {
    const output = document.getElementById('tacOutput');
    let result = '';

    tac.forEach((instr, idx) => {
        if (instr.op === '') {
            result += `${idx + 1}. ${instr.result} = ${instr.arg1}\n`;
        } else {
            result += `${idx + 1}. ${instr.result} = ${instr.arg1} ${instr.op} ${instr.arg2}\n`;
        }
    });

    output.textContent = result || 'No TAC generated';
}

function applyOptimizations(tac) {
    const originalRuntime = calculateRuntime(tac);

    // Constant Folding
    let optimized = constantFolding(tac);
    displayOptimization('constantFoldingOutput', optimized);
    const cf_runtime = calculateRuntime(optimized);

    // Constant Propagation
    optimized = constantPropagation(optimized);
    displayOptimization('constantPropagationOutput', optimized);
    const cp_runtime = calculateRuntime(optimized);

    // Dead Code Elimination
    optimized = deadCodeElimination(optimized);
    displayOptimization('deadCodeOutput', optimized);
    const dce_runtime = calculateRuntime(optimized);

    // Common Subexpression
    optimized = commonSubexpression(optimized);
    displayOptimization('commonSubexprOutput', optimized);
    const cse_runtime = calculateRuntime(optimized);

    // Display performance summary
    displayPerformanceSummary(originalRuntime, cf_runtime, cp_runtime, dce_runtime, cse_runtime);
}

function displayOptimization(elementId, tac) {
    const output = document.getElementById(elementId);
    let result = '';

    tac.forEach((instr, idx) => {
        if (instr.op === '') {
            result += `${instr.result} = ${instr.arg1}\n`;
        } else {
            result += `${instr.result} = ${instr.arg1} ${instr.op} ${instr.arg2}\n`;
        }
    });

    const runtime = calculateRuntime(tac);
    result += `\nRuntime: ${runtime} units`;

    output.textContent = result;
}

function displayPerformanceSummary(original, cf, cp, dce, cse) {
    const output = document.getElementById('performanceSummary');
    
    const improvement = ((original - cse) / original * 100).toFixed(1);
    
    output.innerHTML = `
        <div class="perf-metric">
            <div class="label">Original Runtime</div>
            <div class="value">${original}</div>
        </div>
        <div class="perf-metric">
            <div class="label">After Constant Folding</div>
            <div class="value">${cf}</div>
        </div>
        <div class="perf-metric">
            <div class="label">After Constant Propagation</div>
            <div class="value">${cp}</div>
        </div>
        <div class="perf-metric">
            <div class="label">After Dead Code Elim.</div>
            <div class="value">${dce}</div>
        </div>
        <div class="perf-metric improved">
            <div class="label">Final Runtime</div>
            <div class="value">${cse}</div>
        </div>
        <div class="perf-metric improved">
            <div class="label">Improvement</div>
            <div class="value">${improvement}%</div>
        </div>
    `;
}

// Load example on page load
window.addEventListener('load', () => {
    document.getElementById('exampleBtn').click();
});
