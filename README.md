# Compiler Optimization Visualizer

A professional web-based frontend for visualizing compiler optimization techniques including lexical analysis, parsing, and various code optimization strategies.

## Features

### 🎯 Core Functionality
- **Lexical Analysis**: Tokenizes source code into keywords, identifiers, numbers, operators, and delimiters
- **Syntax Parsing**: Builds Abstract Syntax Tree (AST) using recursive descent parsing
- **Symbol Table**: Tracks variable declarations and their values
- **TAC Generation**: Generates Three Address Code from the AST

### 🚀 Optimization Techniques
1. **Constant Folding**: Evaluates constant expressions at compile time
2. **Constant Propagation**: Replaces variable references with their constant values
3. **Dead Code Elimination**: Removes unused intermediate computations
4. **Common Subexpression Elimination**: Reuses results of duplicate expressions

### 📊 Visualization
- Interactive tabbed interface for different compilation stages
- Color-coded token display
- Structured AST visualization
- Symbol table with detailed information
- Side-by-side optimization comparisons
- Performance metrics and improvement statistics

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- No server or build tools required!

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start experimenting with code!

### Usage

1. **Enter Code**: Type or paste your code in the input area
2. **Load Example**: Click "Load Example" to see a sample program
3. **Compile**: Click "Compile & Optimize" to process the code
4. **Explore**: Navigate through tabs to see different stages:
   - **Tokens**: View lexical analysis results
   - **AST**: See the abstract syntax tree
   - **Symbol Table**: Check variable declarations
   - **TAC**: View three address code
   - **Optimizations**: Compare optimization techniques

## Example Code

```c
int a = 3;
int b = 5;
int c = a * b + 2;
int d = a * b + 7;
```

This example demonstrates:
- Variable declarations
- Arithmetic operations
- Common subexpressions (a * b appears twice)
- Opportunities for optimization

## Project Structure

```
├── index.html          # Main HTML structure
├── styles.css          # Professional styling
├── compiler.js         # Compiler implementation (tokenizer, parser, TAC generator)
├── app.js             # UI logic and event handlers
└── README.md          # This file
```

## Technical Details

### Supported Syntax
- **Data Types**: `int`, `float`
- **Operators**: `+`, `-`, `*`, `/`, `=`
- **Expressions**: Arithmetic expressions with proper precedence
- **Statements**: Variable declarations with initialization

### Optimization Pipeline
```
Original TAC → Constant Folding → Constant Propagation → 
Dead Code Elimination → Common Subexpression Elimination
```

### Runtime Calculation
- Assignment: 1 unit
- Addition/Subtraction: 2 units
- Multiplication: 3 units
- Division: 4 units

## Backend Integration

This frontend is designed to work with the C++ backend:
- `lexicalToTAC.cpp`: Lexical analysis and TAC generation
- `optimizingtech.cpp`: Optimization techniques implementation

The JavaScript implementation mirrors the C++ logic for seamless visualization.

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Future Enhancements

- [ ] Support for more data types (char, double, etc.)
- [ ] Control flow statements (if, while, for)
- [ ] Function declarations and calls
- [ ] More optimization techniques (loop unrolling, strength reduction)
- [ ] Export optimization results
- [ ] Step-by-step execution mode
- [ ] Syntax highlighting in code editor

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## License

This project is open source and available for educational purposes.

## Acknowledgments

Built as a demonstration of compiler design principles and optimization techniques for educational purposes.

---

**Made with ❤️ for Compiler Design Education**
