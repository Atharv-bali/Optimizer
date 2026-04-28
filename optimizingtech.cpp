#include <iostream>
#include <vector>
#include <string>
#include <map>
#include <set>
#include <algorithm>
#include <fstream>

using namespace std;

struct TAC
{
    string result;
    string arg1;
    string op;
    string arg2;
};

int calculateRuntime(vector<TAC> tac)
{
    int runtime = 0;
    for (const auto &t : tac)
    {
        if (t.op == "")
            runtime += 1;
        if (t.op == "+" || t.op == "-")
        {
            runtime += 2;
        }
        else if (t.op == "*")
        {
            runtime += 3;
        }
        else if (t.op == "/")
        {
            runtime += 4;
        }
    }
    return runtime;
}

bool isNumber(const string &s)
{
    for (char c : s)
    {
        if (!isdigit(c))
            return false;
    }
    return true;
}

vector<TAC> constantfolding(vector<TAC> tac)
{
    for (auto &t : tac)
    {
        int res;
        if (isNumber(t.arg1) && isNumber(t.arg2))
        {
            int a = stoi(t.arg1);
            int b = stoi(t.arg2);
            if (t.op == "+")
                res = a + b;
            else if (t.op == "-")
                res = a - b;
            else if (t.op == "*")
                res = a * b;
            else if (t.op == "/")
                res = a / b;
            else
                continue;
        }
        t.arg1 = to_string(res);
        t.arg2 = "";
        t.op = "";
    }
    return tac;
}

vector<TAC> constantPropagation(vector<TAC> tac)
{

    map<string, string> constants;

    for (auto &t : tac)
    {

        if (t.op == "" && isNumber(t.arg1))
            constants[t.result] = t.arg1;

        if (constants.count(t.arg1))
            t.arg1 = constants[t.arg1];

        if (constants.count(t.arg2))
            t.arg2 = constants[t.arg2];
    }

    return tac;
}

vector<TAC> deadCodeElimination(vector<TAC> tac)
{

    set<string> used;
    vector<TAC> result;

    for (int i = tac.size() - 1; i >= 0; i--)
    {

        if (used.count(tac[i].result) || i == tac.size() - 1)
        {

            result.push_back(tac[i]);

            used.insert(tac[i].arg1);
            used.insert(tac[i].arg2);
        }
    }

    reverse(result.begin(), result.end());
    return result;
}
vector<TAC> commonSubexpression(vector<TAC> tac)
{

    map<string, string> expr;

    for (auto &t : tac)
    {

        if (t.op != "")
        {

            string key = t.arg1 + t.op + t.arg2;

            if (expr.count(key))
            {
                t.op = "";
                t.arg1 = expr[key];
                t.arg2 = "";
            }
            else
            {
                expr[key] = t.result;
            }
        }
    }

    return tac;
}

void writeToFile(string filename, vector<TAC> tac)
{
    ofstream file(filename);

    int runtime = calculateRuntime(tac);

    file << "Optimized TAC\n";

    for (auto &t : tac)
    {
        if (t.op == "")
            file << t.result << " = " << t.arg1 << endl;
        else
            file << t.result << " = " << t.arg1 << " " << t.op << " " << t.arg2 << endl;
    }

    file << "\nRuntime : " << runtime << endl;

    file.close();
}

int main()
{

    vector<TAC> tac = {
        {"t1", "3", "*", "5"},
        {"t2", "b", "+", "t1"},
        {"a", "t2", "", ""},
        {"t3", "a", "+", "0"},
        {"c", "t3", "", ""}};

    tac = constantfolding(tac);
    writeToFile("constant_folding.txt", tac);

    tac = constantPropagation(tac);
    writeToFile("constant_propagation.txt", tac);

    tac = deadCodeElimination(tac);
    writeToFile("dead_code_elimination.txt", tac);

    tac = commonSubexpression(tac);
    writeToFile("common_subexpression.txt", tac);
}