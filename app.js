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

    // Step 2: Parse → Syntax Analysis
    const parser = new Parser(currentTokens);
    currentAST = parser.parseProgram();
    displayParseTree(currentAST);
    displayAST(currentAST);

    // Step 3: Build symbol table
    parser.buildSymbolTable(currentAST);
    currentSymbolTable = parser.symbolTable;
    displaySymbolTable(currentSymbolTable);

    // Step 4: Semantic Analysis
    displaySemanticAnalysis(currentAST, currentSymbolTable);

    // Step 5: Generate TAC
    const tacGen = new TACGenerator();
    currentTAC = tacGen.generateProgram(currentAST);
    displayTAC(currentTAC);

    // Step 6: Apply optimizations
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

// ─── Parse Tree (Syntax Analysis) ───────────────────────────────────────────

function displayParseTree(ast) {
    const container = document.getElementById('parseTreeOutput');
    container.innerHTML = '';

    if (!ast || ast.length === 0) {
        container.textContent = 'No parse tree generated';
        return;
    }

    const svg = buildParseTreeSVG(ast);
    container.appendChild(svg);
}

function buildParseTreeSVG(ast) {
    // Build a tree data structure first
    const roots = ast.map((stmt, i) => buildTreeNode(stmt, i));

    // Layout: compute positions
    const NODE_W = 90, NODE_H = 40, H_GAP = 20, V_GAP = 60;
    let xCursor = 0;

    function layoutNode(node, depth) {
        node.depth = depth;
        if (!node.children || node.children.length === 0) {
            node.x = xCursor;
            xCursor += NODE_W + H_GAP;
        } else {
            node.children.forEach(c => layoutNode(c, depth + 1));
            const first = node.children[0].x;
            const last = node.children[node.children.length - 1].x;
            node.x = (first + last) / 2;
        }
    }

    // Wrap all roots under a virtual "Program" root
    const programNode = {
        label: 'Program', nodeType: 'program',
        children: roots
    };
    layoutNode(programNode, 0);

    // Collect all nodes
    const allNodes = [];
    function collect(n) { allNodes.push(n); (n.children || []).forEach(collect); }
    collect(programNode);

    const maxDepth = Math.max(...allNodes.map(n => n.depth));
    const svgW = xCursor + H_GAP;
    const svgH = (maxDepth + 1) * (NODE_H + V_GAP) + 40;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', Math.max(svgW, 600));
    svg.setAttribute('height', svgH);
    svg.setAttribute('class', 'parse-tree-svg');

    function cx(node) { return node.x + NODE_W / 2; }
    function cy(node) { return node.depth * (NODE_H + V_GAP) + NODE_H / 2 + 20; }

    // Draw edges first
    allNodes.forEach(node => {
        (node.children || []).forEach(child => {
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', cx(node));
            line.setAttribute('y1', cy(node) + NODE_H / 2);
            line.setAttribute('x2', cx(child));
            line.setAttribute('y2', cy(child) - NODE_H / 2);
            line.setAttribute('class', 'tree-edge');
            svg.appendChild(line);
        });
    });

    // Draw nodes
    allNodes.forEach(node => {
        const g = document.createElementNS(svgNS, 'g');
        g.setAttribute('class', `tree-node tree-node-${node.nodeType}`);

        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', node.x);
        rect.setAttribute('y', cy(node) - NODE_H / 2);
        rect.setAttribute('width', NODE_W);
        rect.setAttribute('height', NODE_H);
        rect.setAttribute('rx', 8);

        const typeLabel = document.createElementNS(svgNS, 'text');
        typeLabel.setAttribute('x', cx(node));
        typeLabel.setAttribute('y', cy(node) - 4);
        typeLabel.setAttribute('class', 'node-type-label');
        typeLabel.textContent = node.nodeType.toUpperCase();

        const valLabel = document.createElementNS(svgNS, 'text');
        valLabel.setAttribute('x', cx(node));
        valLabel.setAttribute('y', cy(node) + 12);
        valLabel.setAttribute('class', 'node-val-label');
        valLabel.textContent = node.label;

        g.appendChild(rect);
        g.appendChild(typeLabel);
        g.appendChild(valLabel);
        svg.appendChild(g);
    });

    return svg;
}

function buildTreeNode(astNode, idx) {
    if (!astNode) return null;

    if (astNode.type === 'DECL') {
        return {
            label: astNode.value,
            nodeType: 'decl',
            children: astNode.left ? [buildTreeNode(astNode.left)] : []
        };
    }
    if (astNode.type === 'OP') {
        const children = [];
        if (astNode.left) children.push(buildTreeNode(astNode.left));
        if (astNode.right) children.push(buildTreeNode(astNode.right));
        return { label: astNode.value, nodeType: 'op', children };
    }
    if (astNode.type === 'NUM') {
        return { label: astNode.value, nodeType: 'num', children: [] };
    }
    if (astNode.type === 'ID') {
        return { label: astNode.value, nodeType: 'id', children: [] };
    }
    return { label: astNode.value || '?', nodeType: 'unknown', children: [] };
}

// ─── AST (improved visual) ───────────────────────────────────────────────────

function displayAST(ast) {
    const output = document.getElementById('astOutput');
    let result = '';

    ast.forEach((stmt, idx) => {
        result += `┌─ Statement ${idx + 1}: DECL [ ${stmt.value} ]\n`;
        result += printNode(stmt.left, 1, true);
        result += '\n';
    });

    output.textContent = result || 'No AST generated';
}

function printNode(node, depth, isLast) {
    if (!node) return '';

    const indent = depth === 1 ? '│  ' : '│  '.repeat(depth - 1) + '│  ';
    const branch = '├─ ';
    let result = '';

    if (node.type === 'OP') {
        result += `${indent}${branch}OP [ ${node.value} ]\n`;
        result += printNode(node.left, depth + 1, false);
        result += printNode(node.right, depth + 1, true);
    } else {
        result += `${indent}${branch}${node.type} [ ${node.value} ]\n`;
    }

    return result;
}

// ─── Semantic Analysis ───────────────────────────────────────────────────────

function displaySemanticAnalysis(ast, symbolTable) {
    const errors = [];
    const warnings = [];
    const typeInfo = [];
    const scopeInfo = [];
    const annotated = [];

    const declaredVars = new Set();
    const usedVars = new Set();

    ast.forEach((stmt, i) => {
        const varName = stmt.value;

        // Scope: declaration order
        scopeInfo.push(`[${i + 1}] ${varName} declared in global scope`);
        declaredVars.add(varName);

        // Type check the expression
        const exprType = inferType(stmt.left, symbolTable, errors, usedVars, varName, i + 1);
        typeInfo.push(`[${i + 1}] ${varName} : int  ←  expr type: ${exprType}`);

        // Annotated symbol
        const sym = symbolTable[varName];
        annotated.push(
            `${varName}  |  type: ${sym ? sym.type : 'unknown'}  |  value: ${sym ? sym.value : '?'}  |  scope: global  |  line: ${i + 1}`
        );
    });

    // Unused variable warnings
    declaredVars.forEach(v => {
        if (!usedVars.has(v)) {
            warnings.push(`⚠ Variable '${v}' declared but never used in another expression`);
        }
    });

    // Render outputs
    document.getElementById('typeCheckOutput').textContent =
        typeInfo.length ? typeInfo.join('\n') : 'No type information';

    document.getElementById('scopeOutput').textContent =
        scopeInfo.length ? scopeInfo.join('\n') : 'No scope information';

    const errOut = document.getElementById('semanticErrorsOutput');
    if (errors.length === 0 && warnings.length === 0) {
        errOut.textContent = '✅ No semantic errors or warnings found.';
        errOut.style.color = '#4ade80';
    } else {
        errOut.style.color = '';
        errOut.textContent = [...errors.map(e => '❌ ' + e), ...warnings].join('\n');
    }

    document.getElementById('annotatedSymbolOutput').textContent =
        annotated.join('\n');
}

function inferType(node, symbolTable, errors, usedVars, declVar, lineNum) {
    if (!node) return 'void';

    if (node.type === 'NUM') return 'int';

    if (node.type === 'ID') {
        if (!(node.value in symbolTable)) {
            errors.push(`Line ${lineNum}: Variable '${node.value}' used before declaration`);
            return 'unknown';
        }
        if (node.value !== declVar) usedVars.add(node.value);
        return symbolTable[node.value].type || 'int';
    }

    if (node.type === 'OP') {
        const lt = inferType(node.left, symbolTable, errors, usedVars, declVar, lineNum);
        const rt = inferType(node.right, symbolTable, errors, usedVars, declVar, lineNum);
        if (lt !== rt && lt !== 'unknown' && rt !== 'unknown') {
            errors.push(`Line ${lineNum}: Type mismatch — '${lt}' ${node.value} '${rt}'`);
        }
        return lt === 'unknown' ? rt : lt;
    }

    return 'unknown';
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
