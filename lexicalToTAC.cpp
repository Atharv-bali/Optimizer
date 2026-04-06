#include <bits/stdc++.h>
using namespace std;
struct Node
{
    string type; // DECL, OP, NUM, ID
    string value;

    Node *left;
    Node *right;

    Node(string t, string v)
    {
        type = t;
        value = v;
        left = right = NULL;
    }
};

struct Symbol
{
    string type;
    int value;
    bool initialized;
};

map<string, Symbol> symbolTable;

enum TokenType
{
    KEYWORD,
    IDENTIFIER,
    NUMBER,
    OPERATOR,
    DELIMITER,
    END
};

struct Token
{
    TokenType type;
    string value;
};

set<string> keywords = {"int", "float"};

bool isOperator(char c)
{
    return c == '+' || c == '-' || c == '*' || c == '/' || c == '=';
}

bool isDelimiter(char c)
{
    return c == ';' || c == '(' || c == ')';
}

vector<Token> tokenize(string code)
{
    vector<Token> tokens;
    int i = 0, n = code.size();

    while (i < n)
    {
        if (isspace(code[i]))
        {
            i++;
            continue;
        }

        // identifier / keyword
        if (isalpha(code[i]))
        {
            string word;
            while (i < n && (isalnum(code[i]) || code[i] == '_'))
                word += code[i++];

            if (keywords.count(word))
                tokens.push_back({KEYWORD, word});
            else
                tokens.push_back({IDENTIFIER, word});
        }

        // number
        else if (isdigit(code[i]))
        {
            string num;
            while (i < n && isdigit(code[i]))
                num += code[i++];

            tokens.push_back({NUMBER, num});
        }

        // operator
        else if (isOperator(code[i]))
        {
            tokens.push_back({OPERATOR, string(1, code[i])});
            i++;
        }

        // delimiter
        else if (isDelimiter(code[i]))
        {
            tokens.push_back({DELIMITER, string(1, code[i])});
            i++;
        }

        else
        {
            cout << "Unknown char: " << code[i] << endl;
            i++;
        }
    }

    tokens.push_back({END, "EOF"});
    return tokens;
}

class Parser
{
    vector<Token> tokens;
    int pos;

public:
    Parser(vector<Token> t)
    {
        tokens = t;
        pos = 0;
    }

    Token current()
    {
        return tokens[pos];
    }

    void advance()
    {
        if (pos < tokens.size())
            pos++;
    }

    void expect(string val)
    {
        if (current().value != val)
        {
            cout << "Error: Expected " << val << " got " << current().value << endl;
            exit(1);
        }
        advance();
    }

    // FACTOR
    Node *parseFactor()
    {
        Token t = current();

        if (t.type == NUMBER)
        {
            advance();
            return new Node("NUM", t.value);
        }

        if (t.type == IDENTIFIER)
        {
            advance();
            return new Node("ID", t.value);
        }

        if (t.value == "(")
        {
            advance();
            Node *node = parseExpression();
            expect(")");
            return node;
        }

        cout << "Invalid factor\n";
        exit(1);
    }

    // TERM (* /)
    Node *parseTerm()
    {
        Node *node = parseFactor();

        while (current().value == "*" || current().value == "/")
        {
            string op = current().value;
            advance();

            Node *right = parseFactor();

            Node *newNode = new Node("OP", op);
            newNode->left = node;
            newNode->right = right;
            node = newNode;
        }

        return node;
    }

    // EXPRESSION (+ -)
    Node *parseExpression()
    {
        Node *node = parseTerm();

        while (current().value == "+" || current().value == "-")
        {
            string op = current().value;
            advance();

            Node *right = parseTerm();

            Node *newNode = new Node("OP", op);
            newNode->left = node;
            newNode->right = right;
            node = newNode;
        }

        return node;
    }

    // DECLARATION
    Node *parseDeclaration()
    {
        string type = current().value; // int/float
        advance();

        string var = current().value;
        expect(var);

        expect("=");

        Node *expr = parseExpression();

        expect(";");

        Node *decl = new Node("DECL", var);
        decl->left = expr;

        return decl;
    }

    // PROGRAM
    vector<Node *> parseProgram()
    {
        vector<Node *> program;

        while (current().type != END)
        {
            if (current().type == KEYWORD)
            {
                program.push_back(parseDeclaration());
            }
            else
            {
                cout << "Invalid statement\n";
                exit(1);
            }
        }

        return program;
    }
};

void printAST(Node *root, int space = 0)
{
    if (!root)
        return;

    space += 5;
    printAST(root->right, space);

    cout << endl;
    for (int i = 5; i < space; i++)
        cout << " ";
    cout << root->type << ":" << root->value << "\n";

    printAST(root->left, space);
}

int evaluate(Node *root)
{
    if (!root)
        return 0;

    // NUMBER
    if (root->type == "NUM")
    {
        return stoi(root->value);
    }

    // IDENTIFIER
    if (root->type == "ID")
    {
        if (symbolTable.find(root->value) == symbolTable.end())
        {
            cout << "Error: Variable " << root->value << " not declared\n";
            exit(1);
        }

        if (!symbolTable[root->value].initialized)
        {
            cout << "Error: Variable " << root->value << " not initialized\n";
            exit(1);
        }

        return symbolTable[root->value].value;
    }

    // OPERATOR
    if (root->type == "OP")
    {
        int left = evaluate(root->left);
        int right = evaluate(root->right);

        if (root->value == "+")
            return left + right;
        if (root->value == "-")
            return left - right;
        if (root->value == "*")
            return left * right;
        if (root->value == "/")
            return left / right;
    }

    return 0;
}

void buildSymbolTable(vector<Node *> program)
{
    for (auto stmt : program)
    {

        string var = stmt->value;

        // ❗ check redeclaration
        if (symbolTable.find(var) != symbolTable.end())
        {
            cout << "Error: Variable " << var << " already declared\n";
            exit(1);
        }

        Symbol sym;
        sym.type = "int"; // (you can extend later)
        sym.initialized = false;

        // evaluate RHS
        int val = evaluate(stmt->left);

        sym.value = val;
        sym.initialized = true;

        symbolTable[var] = sym;
    }
}

void printSymbolTable()
{
    cout << "\nSYMBOL TABLE:\n";
    cout << "---------------------------\n";
    cout << "Name\tType\tValue\n";

    for (auto &it : symbolTable)
    {
        cout << it.first << "\t"
             << it.second.type << "\t"
             << it.second.value << "\n";
    }
}

int tempCount = 1;

string newTemp()
{
    return "t" + to_string(tempCount++);
}

string generateTAC(Node *root)
{
    if (!root)
        return "";

    // Leaf node
    if (root->type == "NUM" || root->type == "ID")
    {
        return root->value;
    }

    // Operator node
    if (root->type == "OP")
    {
        string left = generateTAC(root->left);
        string right = generateTAC(root->right);

        string temp = newTemp();

        cout << temp << " = " << left << " "
             << root->value << " " << right << endl;

        return temp;
    }

    return "";
}

void generateStatementTAC(Node *stmt)
{
    // stmt is DECL node

    string result = generateTAC(stmt->left);

    cout << stmt->value << " = " << result << endl;
}

void generateProgramTAC(vector<Node *> program)
{
    cout << "\nTHREE ADDRESS CODE:\n";
    cout << "----------------------\n";

    for (auto stmt : program)
    {
        generateStatementTAC(stmt);
    }
}

int main()
{
    string code = R"( 
        int a = 3;
        int b = 2;
        int c = a + b * 4 + 5;
    )";

    vector<Token> tokens = tokenize(code);

    cout << "TOKENS:\n";
    for (auto &t : tokens)
        cout << t.value << " ";
    cout << "\n\n";

    Parser parser(tokens);
    vector<Node *> program = parser.parseProgram();

    cout << "AST:\n";
    for (auto stmt : program)
    {
        printAST(stmt);
        cout << "\n----------------\n";
    }

    buildSymbolTable(program);

    printSymbolTable();

    generateProgramTAC(program);

    return 0;
}