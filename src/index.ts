// Import statements
import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, Option } from 'azle';

// Define types for Customer, Account, Transaction, and Loan
type Customer = {
    id: string;
    name: string;
    balance: number;
};

type Account = {
    accountId: string;
    customerId: string;
    balance: number;
};

type Transaction = {
    id: string;
    accountId: string;
    amount: number;
    type: 'deposit' | 'withdrawal';
    timestamp: Date;
};

type Loan = {
    id: string;
    customerId: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
};

// Define storage for customers, accounts, transactions, and loans
const customersStorage = StableBTreeMap<string, Customer>(0);
const accountsStorage = StableBTreeMap<string, Account>(1);
const transactionsStorage = StableBTreeMap<string, Transaction>(2);
const loansStorage = StableBTreeMap<string, Loan>(3);

// Initialize Express app
const app = express();
app.use(express.json());

// Middleware for error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

// Endpoint to create a new customer
app.post("/customers", (req, res) => {
    try {
        const { name } = req.body;
        const customerId = uuidv4();
        const newCustomer: Customer = {
            id: customerId,
            name: name,
            balance: 0,
        };
        customersStorage.insert(customerId, newCustomer);
        res.json(newCustomer);
    } catch (error) {
        next(error);
    }
});

// Endpoint to create a new account for a customer
app.post("/accounts", (req, res) => {
    try {
        const { customerId } = req.body;
        const accountId = uuidv4();
        const newAccount: Account = {
            accountId: accountId,
            customerId: customerId,
            balance: 0,
        };
        accountsStorage.insert(accountId, newAccount);
        res.json(newAccount);
    } catch (error) {
        next(error);
    }
});

// Endpoint to deposit funds into an account
app.post("/transactions/deposit", (req, res) => {
    try {
        const { accountId, amount } = req.body;
        const transactionId = uuidv4();
        const newTransaction: Transaction = {
            id: transactionId,
            accountId: accountId,
            amount: amount,
            type: 'deposit',
            timestamp: new Date(),
        };
        transactionsStorage.insert(transactionId, newTransaction);

        // Update account balance
        const account = accountsStorage.get(accountId);
        if (account instanceof Option.Some) {
            account.value.balance += amount;
            accountsStorage.insert(accountId, account.value);
            res.json(account.value);
        } else {
            res.status(404).send("Account not found");
        }
    } catch (error) {
        next(error);
    }
});

// Endpoint to withdraw funds from an account
app.post("/transactions/withdraw", (req, res) => {
    try {
        const { accountId, amount } = req.body;
        const transactionId = uuidv4();
        const newTransaction: Transaction = {
            id: transactionId,
            accountId: accountId,
            amount: amount,
            type: 'withdrawal',
            timestamp: new Date(),
        };
        transactionsStorage.insert(transactionId, newTransaction);

        // Update account balance
        const account = accountsStorage.get(accountId);
        if (account instanceof Option.Some) {
            if (account.value.balance >= amount) {
                account.value.balance -= amount;
                accountsStorage.insert(accountId, account.value);
                res.json(account.value);
            } else {
                res.status(400).send("Insufficient funds");
            }
        } else {
            res.status(404).send("Account not found");
        }
    } catch (error) {
        next(error);
    }
});

// Endpoint to check account balance
app.get("/accounts/:accountId/balance", (req, res) => {
    try {
        const accountId = req.params.accountId;
        const account = accountsStorage.get(accountId);
        if (account instanceof Option.Some) {
            res.json({ balance: account.value.balance });
        } else {
            res.status(404).send("Account not found");
        }
    } catch (error) {
        next(error);
    }
});

// Endpoint to apply for a loan
app.post("/loans", (req, res) => {
    try {
        const { customerId, amount } = req.body;
        const loanId = uuidv4();
        const newLoan: Loan = {
            id: loanId,
            customerId: customerId,
            amount: amount,
            status: 'pending',
        };
        loansStorage.insert(loanId, newLoan);
        res.json(newLoan);
    } catch (error) {
        next(error);
    }
});

// Endpoint to retrieve all transactions for an account
app.get("/accounts/:accountId/transactions", (req, res) => {
    try {
        const accountId = req.params.accountId;
        const accountTransactions = transactionsStorage.values().filter(transaction => transaction.accountId === accountId);
        res.json(accountTransactions);
    } catch (error) {
        next(error);
    }
});

// Start the Express server
export default Server(() => {
    return app.listen();
});
