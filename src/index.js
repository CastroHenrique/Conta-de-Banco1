const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const customers = []; // Banco de Dados

// *** MIDDLEWARE ***
function verifyAccount(req, res, next) {
    const cpf = req.headers.cpf
    
    const accountExist = customers.find((account) => account.cpf === cpf )

    if (!accountExist) {
        
        return res.status(400).json({ error: "Account not found"})
    }
    req.accountExist = accountExist
    return next();
};
// *** BALANCE ***
function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
       if(operation.type === 'credit') {
            return acc + operation.amount;
       }else {
            return acc - operation.amount;
       }
}, 0)

    return balance;
};
// *** CREATE ACCOUNT *** 
app.post('/account', (req, res) => {
    const  { cpf, name }  = req.body
    
    const cpfExist = customers.some((customer) => customer.cpf === cpf)

    if (cpfExist) {
        return res.status(400).json({ error: "Customer Exist"})
    };
   
    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    });
    
    return res.status(201).json({message: "Create Success"}).send();
});
// *** STATEMENT ACCOUNT ***
app.get('/statement', verifyAccount, (req, res) => {
    const { accountExist } = req;
    
    return res.json(accountExist.statement);
});
// *** DEPOSIT ***
app.post('/deposit', verifyAccount, (req, res) => {
    const { description, amount} = req.body;
    const { accountExist }  = req;

    if(!description || !amount) {
        return res.json({ error: "fill in all fields"})
    };

    const statementOperation = {
        description,
        amount,
        created_At: new Date(),
        type: 'credit',
    };
    
    accountExist.statement.push(statementOperation);

    return res.status(201).send();
});
// *** WITHDRAW ***
app.post('/withdraw', verifyAccount, (req, res) => {

    const { amount } = req.body;
    const { accountExist }  = req;

    if(!amount) {
        return res.json({ error: "fill in all fields"})
    };

    const balance = getBalance(accountExist.statement);
    console.log(balance)

    if (balance < amount) {
        return res.status(400).json({ error: "Insuficient Funds!", });
    }

    const statementOperation = {
        amount,
        created_At: new Date(),
        type: 'debit'
    };

    accountExist.statement.push(statementOperation);
    console.log(balance)

    return res.status(201).send();
});
// *** STATEMENT ACCOUNT FOR DATE ***
app.get('/statement/date', verifyAccount, (req, res) => {
    const { accountExist } = req;
    const { date } = req.query
    
    const dateFormatted = new Date(date + " 00:00")

    const satatement = accountExist.statement.filter((statement) => statement.created_At.toDateString() === new Date(dateFormatted).toDateString())

    return res.json(accountExist.statement);
});
// *** UPDATE ACCOUNT ***
app.put('/account', verifyAccount, (req, res) => {
    const { name } = req.body;
    const { accountExist } = req;

    accountExist.name = name;

    return res.status(201).send();
});
// *** GET UPDATE ACCOUNT *** 
app.get('/account', verifyAccount, (req, res) => {
    const {accountExist} = req;
    return res.json(accountExist);
});
// *** DELETE ACCOUNT ***
app.delete('/account', verifyAccount, (req, res) => {
    const {accountExist} = req;

    customers.splice(accountExist, 1);

    return res.status(200).json(customers);
});
// *** GET BALANCE ***
app.get('/balance', verifyAccount, (req, res) => {
    const {accountExist} = req;
    const balance = getBalance(accountExist.statement);

    return res.json(balance);
});

app.listen(3333)