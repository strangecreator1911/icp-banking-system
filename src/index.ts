// cannister code goes here
import { Server, StableBTreeMap } from 'azle';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

// Define types for Customer, Account, Transaction, and Loan

// Customer type
type Customer = {
    id: string;
    name: string;
    balance: number;
};

// Account type
type Account = {
    accountId: string;
    customerId: string;
    balance: number;
};

// Transaction type
type Transaction = {
    id: string;
    accountId: string;
    amount: number;
    type: 'deposit' | 'withdrawal';
    timestamp: Date;
};

// Loan type
type Loan = {
    id: string;
    customerId: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
};

// Define storage for customers, accounts, transactions, and loans
const customersStorage = StableBTreeMap<string, Customer>(0);
const accountsStorage = StableBTreeMap<string, Account>(0);
const transactionsStorage = StableBTreeMap<string, Transaction>(0);
const loansStorage = StableBTreeMap<string, Loan>(0);

export default Server(() => {
    const app = express();
    app.use(express.json());

    // Endpoint to create a new customer
    app.post("/customers", (req, res) => {
        const { name } = req.body;
        const customerId = uuidv4();
        const newCustomer: Customer = {
            id: customerId,
            name: name,
            balance: 0,
        };
        customersStorage.insert(customerId, newCustomer);
        res.json(newCustomer);
    });

    // Endpoint to create a new account for a customer
    app.post("/accounts", (req, res) => {
        const { customerId } = req.body;
        const accountId = uuidv4();
        const newAccount: Account = {
            accountId: accountId,
            customerId: customerId,
            balance: 0,
        };
        accountsStorage.insert(accountId, newAccount);
        res.json(newAccount);
    });

    // Endpoint to deposit funds into an account
    app.post("/transactions/deposit", (req, res) => {
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
        const account = accountsStorage.get(accountId).Some;
        if (account) {
            account.balance += amount;
            accountsStorage.insert(accountId, account);
            res.json(account);
        } else {
            res.status(404).send("Account not found");
        }
    });

    // Endpoint to withdraw funds from an account
    app.post("/transactions/withdraw", (req, res) => {
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
        const account = accountsStorage.get(accountId).Some;
        if (account) {
            if (account.balance >= amount) {
                account.balance -= amount;
                accountsStorage.insert(accountId, account);
                res.json(account);
            } else {
                res.status(400).send("Insufficient funds");
            }
        } else {
            res.status(404).send("Account not found");
        }
    });

    // Endpoint to check account balance
    app.get("/accounts/:accountId/balance", (req, res) => {
        const accountId = req.params.accountId;
        const account = accountsStorage.get(accountId).Some;
        if (account) {
            res.json({ balance: account.balance });
        } else {
            res.status(404).send("Account not found");
        }
    });

    // Endpoint to apply for a loan
    app.post("/loans", (req, res) => {
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
    });

    // Endpoint to retrieve all transactions for an account
    app.get("/accounts/:accountId/transactions", (req, res) => {
        const accountId = req.params.accountId;
        const accountTransactions = transactionsStorage.values().filter(transaction => transaction.accountId === accountId);
        res.json(accountTransactions);
