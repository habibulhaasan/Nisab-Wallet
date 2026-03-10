// src/app/dashboard/guide/page.js
'use client';

import { useState } from 'react';
import {
  BookOpen, CreditCard, Receipt, ArrowRightLeft, FolderOpen,
  Target, PiggyBank, HandCoins, Blend, Sprout, Star, BarChart3,
  Repeat, FileText, ShoppingBag, ChevronDown, ChevronRight,
  CheckCircle2, AlertCircle, Info, Lightbulb, Wallet, Building2,
  Smartphone, Coins, TrendingUp, TrendingDown, Moon, Shield,
  Clock, Calendar, Search, Filter, Edit2, Trash2, Zap, RefreshCw,
} from 'lucide-react';

// ─── All guide data ───────────────────────────────────────────────────────────
const GUIDES = [
  {
    id: 'accounts',
    icon: CreditCard,
    color: 'blue',
    title: 'Accounts',
    subtitle: 'Your financial containers',
    summary: 'Accounts are the foundation of everything in Nisab Wallet. Every transaction, transfer, goal, and Zakat calculation is tied to an account balance.',
    sections: [
      {
        heading: 'What is an Account?',
        type: 'text',
        content: 'An account represents any place you hold money — your wallet, a bank account, mobile banking app, gold, or silver. Nisab Wallet consolidates all of them into one view so you always know your total wealth.',
      },
      {
        heading: 'Account Types',
        type: 'list',
        items: [
          { icon: Wallet,      label: 'Cash',           desc: 'Physical money in your pocket or home safe' },
          { icon: Building2,   label: 'Bank Account',   desc: 'Savings or current accounts at any bank (DBBL, Dutch-Bangla, bKash Bank, etc.)' },
          { icon: Smartphone,  label: 'Mobile Banking', desc: 'bKash, Nagad, Rocket, or any mobile financial service wallet' },
          { icon: Coins,       label: 'Gold',           desc: 'Enter the current market value in Taka — update when prices change' },
          { icon: Coins,       label: 'Silver',         desc: 'Enter current market value in Taka — also feeds the Nisab threshold calculation' },
        ],
      },
      {
        heading: 'How to Get Started',
        type: 'steps',
        items: [
          'Click "Load Defaults" to instantly create Cash, Bank 1, bKash, and Bank 2 with zero balance',
          'Or click "Add Account", choose a type, name it, and enter your current balance',
          'Balances update automatically when you record transactions — you can also edit them directly',
          'Delete an account only when it has no linked transactions, goals, or loans',
        ],
      },
      {
        heading: 'Goal Allocation on Account Cards',
        type: 'callout',
        variant: 'info',
        content: 'When Goals are linked to an account, the card shows two figures: Total Balance and Available to Spend. Available = Total minus amount reserved for goals. Expense transactions cannot use goal-reserved money — the system blocks this automatically.',
      },
      {
        heading: 'How Accounts Connect to Every Feature',
        type: 'flow',
        items: [
          { label: 'Transactions', desc: 'Every income/expense instantly credits or debits a chosen account' },
          { label: 'Transfers', desc: 'Move money between accounts — both balances update simultaneously' },
          { label: 'Goals', desc: 'Funds are ring-fenced inside an account for a goal, reducing Available balance' },
          { label: 'Loans & Lendings', desc: 'Borrowed/lent amounts are drawn from or added to a selected account' },
          { label: 'Zakat', desc: 'Sum of ALL account balances = your total wealth compared against Nisab' },
          { label: 'Analytics', desc: 'Account filter lets you view income/expense for one account only' },
        ],
      },
      {
        heading: 'Pro Tips',
        type: 'tips',
        items: [
          'Name accounts descriptively — "DBBL Savings" instead of "Bank" makes transaction history much clearer',
          'Update Gold and Silver account values at least monthly when you check market prices',
          'You need at least 1 account before recording any transaction',
          'You need at least 2 accounts to use the Transfer feature',
          'The "Sparkle" badge marks default accounts — these are just labels, all accounts work identically',
        ],
      },
    ],
  },

  {
    id: 'categories',
    icon: FolderOpen,
    color: 'violet',
    title: 'Categories',
    subtitle: 'Label and organise every transaction',
    summary: 'Categories organise your money flow into named groups. They are required for every transaction and power Analytics charts, Budget limits, and Tax file sections.',
    sections: [
      {
        heading: 'Why Categories Are Essential',
        type: 'text',
        content: 'Every transaction must belong to a category. Categories reveal patterns — how much you spent on food, transport, or health last month. They also feed directly into Budget tracking and Tax file income grouping. Without good categories, Analytics is meaningless.',
      },
      {
        heading: 'Two Types of Categories',
        type: 'list',
        items: [
          { icon: TrendingUp,   label: 'Income Categories',  desc: 'For money coming in: Salary, Bonus, Freelance, Rental Income, Business Revenue, etc.' },
          { icon: TrendingDown, label: 'Expense Categories', desc: 'For money going out: Food, Transport, Healthcare, Shopping, Utility Bills, etc.' },
        ],
      },
      {
        heading: 'Load Defaults (Quick Start)',
        type: 'callout',
        variant: 'info',
        content: 'Click "Load Defaults" to instantly add: Income — Salary, Bonus, Loan. Expense — Transportation, Shopping, Foods, Healthcare, Loan Payment. These cover the most common Bangladeshi household flows and get you started in seconds.',
      },
      {
        heading: 'Creating a Custom Category',
        type: 'steps',
        items: [
          'Click "Add Category" and type a name (e.g., "Groceries" or "Freelance Income")',
          'Choose the type: Income or Expense — you cannot change this later without deleting and recreating',
          'Pick a colour from 10 preset swatches — this colour appears as a dot in the transaction list and in Analytics charts',
          'Save — the category is immediately available in the transaction form',
        ],
      },
      {
        heading: 'Renaming is Completely Safe',
        type: 'callout',
        variant: 'success',
        content: 'Each category has a permanent internal ID. If you rename "Foods" to "Groceries & Dining", all past transactions keep their correct category in analytics and reports. Renaming never breaks historical data.',
      },
      {
        heading: 'Pro Tips',
        type: 'tips',
        items: [
          'Create categories before adding transactions — they are required when logging any income or expense',
          'Keep categories specific enough to be useful but broad enough to reuse daily (e.g., "Dining Out" not "Biryani from ABC Restaurant")',
          'Use consistent colours by theme — all food in pink, all transport in red — for faster chart reading',
          'Categories used in Budgets automatically show actual vs. budgeted spending',
          'Income categories can be mapped to tax heads in the Tax File feature',
        ],
      },
    ],
  },

  {
    id: 'transactions',
    icon: Receipt,
    color: 'emerald',
    title: 'Transactions',
    subtitle: 'Record every money movement',
    summary: 'Transactions are the engine of Nisab Wallet. Every time money comes in or goes out, you log it here. Account balances, analytics, budgets, and Zakat wealth all update from this single source of truth.',
    sections: [
      {
        heading: 'Three Transaction Types',
        type: 'list',
        items: [
          { icon: TrendingUp,    label: 'Income',   desc: 'Money received from outside — salary, freelance payment, rental, gift. Increases account balance.' },
          { icon: TrendingDown,  label: 'Expense',  desc: 'Money you spent — food, transport, bills, shopping. Decreases account balance.' },
          { icon: ArrowRightLeft,label: 'Transfer', desc: 'Money moved between your own accounts. No net change in total wealth. Both account balances update.' },
        ],
      },
      {
        heading: 'Recording a Transaction Step by Step',
        type: 'steps',
        items: [
          'Click "Add Transaction" — this button is disabled until you have at least 1 account AND 1 category',
          'Choose the tab: Income (green), Expense (red), or Transfer (blue)',
          'Enter the amount in the large field at the top',
          'Select the Account — dropdown shows each account with its Available balance',
          'Select the Category — only categories matching the transaction type appear',
          'Set the date — defaults to today but can be any past date',
          'Add an optional Note for future reference (e.g., "Rent – March 2026")',
          'Click Confirm — the account balance updates immediately and the transaction appears in the list',
        ],
      },
      {
        heading: 'Goal-Aware Balance Protection',
        type: 'callout',
        variant: 'warning',
        content: 'When recording an Expense, the system checks your Available balance (total minus goal allocations). If the expense exceeds available funds — even if the raw account balance looks sufficient — the transaction is blocked with a detailed error message showing how much is reserved for goals and what is truly available.',
      },
      {
        heading: 'Filters and Search',
        type: 'list',
        items: [
          { icon: Filter,   label: 'Type Filter',    desc: 'Show All transactions, Income only, or Expense only' },
          { icon: Wallet,   label: 'Account Filter', desc: 'View transactions for one specific account' },
          { icon: Clock,    label: 'Period Filter',  desc: 'Today, This Week (Sat–Fri), This Month, This Year, All Time, or a Custom Date Range' },
          { icon: Search,   label: 'Search',         desc: 'Search by description, amount, category name, or account name — results update as you type' },
        ],
      },
      {
        heading: 'Summary Cards at the Top',
        type: 'text',
        content: 'Four cards always show: Total Balance (sum of all accounts), Income for the selected period, Expense for the period, and Net (Income minus Expense). Transfers are excluded from Income and Expense totals — they do not inflate or deflate your real financial picture.',
      },
      {
        heading: 'Editing and Deleting Transactions',
        type: 'steps',
        items: [
          'Click the pencil icon on any row to edit it',
          'The system reverses the original balance effect, then applies the new values — account balance is always kept correct',
          'Changing the account while editing also correctly adjusts both the old and new account',
          'Click the trash icon to delete — a confirmation dialog appears first, and the account balance is restored automatically',
        ],
      },
      {
        heading: 'How Transfers Appear in This List',
        type: 'callout',
        variant: 'info',
        content: 'Each transfer shows as TWO rows: an Expense on the source account and an Income on the destination. They are permanently linked — editing or deleting one side updates the complete transfer. A blue ⇄ icon marks them so they are easy to identify among regular transactions.',
      },
      {
        heading: 'Pro Tips',
        type: 'tips',
        items: [
          'Record transactions the same day for accurate period summaries — backdating works but requires discipline',
          'Use the Note field for contextual detail: "Eid shopping – Bashundhara City" is much more useful than just "Shopping"',
          'The weekly period resets on Saturday — standard Bangladesh work week',
          'The Transfer tab in the modal requires at least 2 accounts and is disabled otherwise',
          'The transaction list is grouped by date — each date shows a daily income/expense subtotal at the header',
        ],
      },
    ],
  },

  {
    id: 'transfer',
    icon: ArrowRightLeft,
    color: 'cyan',
    title: 'Transfer',
    subtitle: 'Move money between your accounts',
    summary: 'Transfer moves funds from one of your accounts to another without counting it as income or expense — keeping your total wealth figure accurate.',
    sections: [
      {
        heading: 'When to Use Transfer (Not Expense + Income)',
        type: 'text',
        content: 'Use Transfer any time you move money between accounts you own: withdrawing from bank to top up bKash, moving salary to savings, or shifting funds between two bank accounts. Recording this as Expense + Income would double-count your income and over-inflate your expense figure in Analytics.',
      },
      {
        heading: 'How to Transfer',
        type: 'steps',
        items: [
          'Go to Transfer from the sidebar — or use the Transfer tab inside the Add Transaction modal',
          'Select the "From" account — the dropdown shows its current balance',
          'Select the "To" account — cannot be the same as From',
          'Enter the amount — system checks you have sufficient available balance (after goal allocations)',
          'Set a date — can be backdated',
          'Add an optional description or note',
          'Click "Transfer Money" — both account balances update instantly',
        ],
      },
      {
        heading: 'What Happens Behind the Scenes',
        type: 'flow',
        items: [
          { label: 'From Account', desc: 'Balance decreases by the transfer amount' },
          { label: 'To Account',   desc: 'Balance increases by the transfer amount' },
          { label: 'Transfer Record', desc: 'Saved to the transfers collection with both account names, amount, date, and note' },
          { label: 'Transaction List', desc: 'Appears as two linked rows — an Expense on From and an Income on To, both marked with ⇄' },
          { label: 'Analytics & Zakat', desc: 'Transfers excluded from income/expense charts — total wealth unchanged' },
        ],
      },
      {
        heading: 'Pro Tips',
        type: 'tips',
        items: [
          'Always use Transfer (not Expense + Income) when moving between your own accounts — wrong method breaks analytics',
          'The dedicated Transfer page also shows your full transfer history with both account names and amounts',
          'You can edit or delete a transfer from the Transaction list — both sides update together',
          'Transfer requires at least 2 accounts — add more accounts in the Accounts section first',
        ],
      },
    ],
  },

  {
    id: 'budgets',
    icon: PiggyBank,
    color: 'teal',
    title: 'Budgets',
    subtitle: 'Monthly spending limits per category',
    summary: 'Set a maximum monthly spend for each expense category. The system reads your actual transactions in real time and shows how much of each budget you have used — with colour-coded alerts.',
    sections: [
      {
        heading: 'How Budgets Work',
        type: 'text',
        content: 'Each month, you define a spending limit per expense category. Nisab Wallet reads your actual expense transactions for that calendar month and calculates how much of each limit you have used. A progress bar with colour coding shows your status at a glance.',
      },
      {
        heading: 'Setting Up Your Monthly Budgets',
        type: 'steps',
        items: [
          'Go to Budgets — all your Expense categories are listed automatically',
          'Enter a monthly limit (in Taka) next to each category you want to control',
          'Leave blank for categories with no limit — their actual spend will still be displayed',
          'Click "Save All Budgets" — limits immediately apply to the current calendar month',
          'Budgets are per-month — reset each month and you set new limits at the start of each month',
        ],
      },
      {
        heading: 'Reading the Budget Progress Cards',
        type: 'list',
        items: [
          { icon: CheckCircle2, label: 'On Track (Green)',  desc: 'Spent less than 80% of the limit — spending is under control' },
          { icon: AlertCircle,  label: 'Warning (Amber)',   desc: 'Spent 80–99% of limit — consider slowing spending in this category' },
          { icon: AlertCircle,  label: 'Over Budget (Red)', desc: 'Exceeded the limit — needs immediate attention' },
          { icon: Info,         label: 'No Limit Set',      desc: 'Category has transactions this month but no budget set — consider adding one' },
        ],
      },
      {
        heading: 'Copy from Previous Month',
        type: 'callout',
        variant: 'info',
        content: 'If you set budgets last month, a "Copy from Previous Month" option appears at the start of a new month. This saves you from re-entering the same limits. You can then adjust individual categories before saving.',
      },
      {
        heading: 'Drilling into a Budget Category',
        type: 'text',
        content: 'Click on any budget card to navigate to the transaction list pre-filtered to that category for the current month. You can see exactly which transactions consumed the budget.',
      },
      {
        heading: 'Pro Tips',
        type: 'tips',
        items: [
          'Create your expense categories first — budget limits can only be set for existing categories',
          'Even without limits, the Budgets page shows actual spending per category — useful for understanding your habits before setting limits',
          'Check Analytics → Category Pie Chart to see which categories are largest before deciding which to budget',
          'Budgets do not block transactions — they are awareness tools, not hard locks',
        ],
      },
    ],
  },

  {
    id: 'goals',
    icon: Target,
    color: 'orange',
    title: 'Financial Goals',
    subtitle: 'Ring-fence money for a purpose',
    summary: 'Goals let you reserve a portion of an account balance for a specific purpose — a holiday, emergency fund, wedding, or device. Reserved money is protected from accidental spending.',
    sections: [
      {
        heading: 'What a Goal Does',
        type: 'text',
        content: 'A goal marks a slice of an account balance as "reserved". The account balance total does not change, but Available to Spend drops by the reserved amount. Any expense or transfer that would dip into goal money is automatically blocked by the system.',
      },
      {
        heading: 'Creating a Goal',
        type: 'steps',
        items: [
          'Click "Add Goal" and enter a name (e.g., "Emergency Fund" or "Eid Shopping 2026")',
          'Set the Target Amount — the total you want to save toward',
          'Set the Target Date — your deadline for reaching the goal',
          'Choose the Linked Account — goal funds sit in this account',
          'Set Priority: Low, Medium, or High',
          'Enter a starting amount if you have already set some aside (optional)',
          'Toggle notifications on to get milestone alerts (25%, 50%, 75%, 100%)',
          'Save — the goal appears in your Goals list and the linked account card updates',
        ],
      },
      {
        heading: 'Depositing and Withdrawing',
        type: 'list',
        items: [
          { icon: TrendingUp,   label: 'Deposit into Goal',  desc: 'Allocate more money from the linked account — Available balance on that account decreases' },
          { icon: TrendingDown, label: 'Withdraw from Goal', desc: 'Release funds back — Available balance on the account increases; use for planned spending from the goal' },
        ],
      },
      {
        heading: 'Goal Statuses',
        type: 'list',
        items: [
          { icon: Clock,        label: 'In Progress', desc: 'Active — currently saving toward the target amount' },
          { icon: CheckCircle2, label: 'Completed',   desc: 'Reached 100% of target — well done! Funds remain reserved until you withdraw them' },
          { icon: AlertCircle,  label: 'Overdue',     desc: 'Past the target date but target not yet reached — consider adjusting the date or adding funds' },
        ],
      },
      {
        heading: 'How Goals Protect Your Money',
        type: 'callout',
        variant: 'warning',
        content: 'Example: Your Bank Account has ৳50,000 total. You have ৳20,000 allocated to a "New Laptop" goal. Available = ৳30,000. If you try to record a ৳35,000 expense from that account, the system blocks it with an error — even though the raw balance shows ৳50,000.',
      },
      {
        heading: 'Pro Tips',
        type: 'tips',
        items: [
          'The goal card shows a monthly savings target — how much you need to deposit each month to reach the goal on time',
          'You can link multiple goals to the same account — each one reserves its own slice',
          'When a goal is complete, withdraw the funds or mark it done to release the Available balance',
          'Filter goals by In Progress / Completed / All using the status tabs',
          'Click the eye icon to see the full deposit and withdrawal history for any goal',
        ],
      },
    ],
  },

  {
    id: 'loans',
    icon: HandCoins,
    color: 'rose',
    title: 'Loans',
    subtitle: 'Track money you borrowed',
    summary: 'Track every loan you have taken — from banks, institutions, or individuals — including repayment schedules, interest calculations, and a complete payment history.',
    sections: [
      {
        heading: 'How Loans Work in Nisab Wallet',
        type: 'text',
        content: 'When you borrow money, you record it as a Loan. The borrowed amount is credited to your selected account (increasing its balance). Each repayment you make reduces both the loan balance and the account balance. Full history of all payments is maintained.',
      },
      {
        heading: 'Loan Types Supported',
        type: 'list',
        items: [
          { icon: Shield,     label: 'Qard Hasan (Interest-Free)', desc: 'Islamic lending with zero interest. You repay exactly what you borrowed. Choose this for loans from family, friends, or Islamic banks.' },
          { icon: TrendingUp, label: 'Conventional (With Interest)', desc: 'Bank or formal loans with an interest rate. Enter rate and either monthly payment or total months — the system auto-calculates the other and total repayment.' },
        ],
      },
      {
        heading: 'Adding a New Loan',
        type: 'steps',
        items: [
          'Click "Add Loan" and enter the lender name (person or bank)',
          'Choose loan type: Qard Hasan (0% interest) or Conventional',
          'Enter the principal amount borrowed',
          'For conventional loans: enter the interest rate (annual %) and either monthly payment or number of months — the system calculates the other value',
          'Set the loan start date',
          'Select which account receives the borrowed amount — that account balance increases immediately',
          'Enable reminders to receive payment due date alerts',
          'Save — the loan appears in your active loans list',
        ],
      },
      {
        heading: 'Recording a Repayment',
        type: 'steps',
        items: [
          'Click "Pay" on any active loan card',
          'Enter the repayment amount',
          'Select the account the payment comes from — that account balance decreases',
          'Set the payment date',
          'Add an optional note',
          'Confirm — loan outstanding balance reduces and payment is logged to history',
          'When fully repaid, loan status changes to "Paid" automatically',
        ],
      },
      {
        heading: 'Loan Dashboard Summary',
        type: 'list',
        items: [
          { icon: HandCoins,    label: 'Total Borrowed',    desc: 'Sum of all original loan principal amounts' },
          { icon: TrendingDown, label: 'Total Outstanding', desc: 'How much you still owe across all loans combined' },
          { icon: CheckCircle2, label: 'Total Repaid',      desc: 'How much you have already paid back in total' },
          { icon: AlertCircle,  label: 'Overdue',           desc: 'Loans past their scheduled repayment — highlighted in red for attention' },
        ],
      },
      {
        heading: 'Pro Tips',
        type: 'tips',
        items: [
          'Enable reminders when creating a loan — you will get an in-app notification before the payment is due',
          'For Qard Hasan loans, add the lender name and any agreed terms in the Notes field',
          'Filter loans by Active, Paid, or Overdue using the tabs at the top',
          'Click the eye icon on any loan to view its complete payment history',
          'Loan balances in accounts count toward your Zakat wealth total — be aware of this when calculating',
        ],
      },
    ],
  },

  {
    id: 'lendings',
    icon: Blend,
    color: 'amber',
    title: 'Lend',
    subtitle: 'Track money others owe you',
    summary: 'Lend is the mirror of Loans — it tracks money you have given to others (friends, family, colleagues) and monitors repayment status and history.',
    sections: [
      {
        heading: 'Loans vs. Lend — Key Difference',
        type: 'callout',
        variant: 'info',
        content: 'Loans module = money you borrowed (you owe someone else). Lend module = money you gave out (someone owes you). They are completely separate modules. Never mix them up — they affect your account balances in opposite directions.',
      },
      {
        heading: 'Adding a Lending Record',
        type: 'steps',
        items: [
          'Click "Add Lending" and enter the borrower\'s full name',
          'Add their phone number, email, and address — useful for follow-up if repayment is late',
          'Set the lending type: Qard Hasan (no interest) or with agreed terms',
          'Enter the principal amount lent and the lending date',
          'Set a due date for expected repayment',
          'Choose repayment type: Full Payment (one lump sum) or Installments (agreed regular amounts)',
          'For installments, enter the agreed installment amount',
          'Select which account the money leaves from — balance decreases immediately',
          'Add notes about any collateral, witnesses, or special conditions',
        ],
      },
      {
        heading: 'Recording a Repayment Received',
        type: 'steps',
        items: [
          'Find the lending and click "Repayment"',
          'Enter the amount received back',
          'Choose which account to deposit it into',
          'Set the repayment date',
          'Confirm — outstanding balance decreases, the repayment is logged to history',
          'When fully repaid, status changes to "Settled" automatically',
        ],
      },
      {
        heading: 'Repayment Types',
        type: 'list',
        items: [
          { icon: CheckCircle2, label: 'Full Payment',  desc: 'Borrower repays the entire outstanding amount at once — simplest to track' },
          { icon: Repeat,       label: 'Installments',  desc: 'Borrower repays in agreed chunks — each repayment is logged separately with a running outstanding balance' },
        ],
      },
      {
        heading: 'Pro Tips',
        type: 'tips',
        items: [
          'Always record borrower contact details — easy follow-up reference if repayment is delayed',
          'Use the Reminder feature to schedule a follow-up notification near the agreed due date',
          'Overdue lendings (past due date, not yet settled) are highlighted in red automatically',
          'The lending detail page (eye icon) shows the full repayment timeline in chronological order',
        ],
      },
    ],
  },

  {
    id: 'investments',
    icon: Sprout,
    color: 'green',
    title: 'Investments',
    subtitle: 'Track your portfolio and returns',
    summary: 'Track all long-term wealth-building assets — stocks, fixed deposits, savings certificates, real estate, crypto, and more — with automatic return calculations.',
    sections: [
      {
        heading: 'Supported Investment Types',
        type: 'list',
        items: [
          { icon: TrendingUp,  label: 'Stocks',                desc: 'Listed shares — track current market value vs. purchase price for capital gain/loss' },
          { icon: TrendingUp,  label: 'Mutual Funds',          desc: 'Pooled investment — enter current NAV and units to track total value' },
          { icon: Coins,       label: 'DPS',                   desc: 'Deposit Pension Scheme — monthly bank savings with maturity amount' },
          { icon: Coins,       label: 'FDR (Fixed Deposit)',   desc: 'Lump sum with guaranteed return — enter maturity value for return calculation' },
          { icon: FileText,    label: 'Savings Certificate',   desc: 'Government Sanchayapatra — enter face value and maturity date' },
          { icon: FileText,    label: 'Bond',                  desc: 'Corporate or government bonds — track coupon payments and maturity' },
          { icon: Shield,      label: 'PPF',                   desc: 'Public Provident Fund — long-term government-backed scheme' },
          { icon: Shield,      label: 'Pension Fund',          desc: 'Employer or personal pension contributions and projected value' },
          { icon: Zap,         label: 'Cryptocurrency',        desc: 'Digital assets — enter purchase price and current value for gain/loss tracking' },
          { icon: Building2,   label: 'Real Estate',           desc: 'Property — track purchase price and current estimated market value' },
        ],
      },
      {
        heading: 'Adding an Investment',
        type: 'steps',
        items: [
          'Click "Add Investment" and select the investment type from the dropdown',
          'Enter the investment name (e.g., "DBBL FDR — 6 months" or "Grameen Phone Stock")',
          'Enter the amount invested and the purchase/start date',
          'Enter the current value or expected return — the system calculates gain/loss amount and percentage',
          'Set the maturity date if applicable (FDR, DPS, Bonds, Savings Certificates)',
          'Add notes for broker details, account numbers, or terms',
          'Save — the investment appears in the portfolio summary',
        ],
      },
      {
        heading: 'Portfolio Summary Cards',
        type: 'list',
        items: [
          { icon: TrendingUp,   label: 'Total Invested',   desc: 'Sum of all capital you have put into all investments' },
          { icon: Coins,        label: 'Current Value',    desc: 'Total current market/maturity value of your entire portfolio' },
          { icon: TrendingUp,   label: 'Total Return',     desc: 'Overall gain or loss in both Taka amount and percentage' },
          { icon: BarChart3,    label: 'Allocation Chart', desc: 'Portfolio breakdown by investment type — see your diversification at a glance' },
        ],
      },
      {
        heading: 'Investment Statuses',
        type: 'list',
        items: [
          { icon: TrendingUp,   label: 'Active',   desc: 'Currently running investment — being tracked for returns' },
          { icon: CheckCircle2, label: 'Matured',  desc: 'Reached maturity date — consider withdrawing or renewing' },
          { icon: Clock,        label: 'Sold',     desc: 'You exited the position — return is locked in and historical record is preserved' },
        ],
      },
      {
        heading: 'Pro Tips',
        type: 'tips',
        items: [
          'Update the current value of Stocks and Crypto regularly for accurate return calculations — prices change daily',
          'Filter to Active status and sort by maturity date to spot upcoming FDR/DPS maturities before they happen',
          'Investment values do not automatically feed into your account balances — record a transaction when you actually withdraw or reinvest returns',
          'Click any investment to open its detail page with full transaction history and return breakdown',
          'Use the search box to quickly find a specific investment by name in a large portfolio',
        ],
      },
    ],
  },

  {
    id: 'zakat',
    icon: Star,
    color: 'indigo',
    title: 'Zakat',
    subtitle: 'Automated Islamic obligation tracking',
    summary: 'The Zakat module fully automates the Hawl cycle — detecting when wealth crosses Nisab, tracking the full Hijri lunar year, calculating 2.5%, and storing complete cycle and payment history.',
    sections: [
      {
        heading: 'Key Islamic Concepts Explained',
        type: 'list',
        items: [
          { icon: Coins, label: 'Nisab',  desc: 'Minimum wealth threshold. Set to 52.5 Tola (612.36 grams) of silver. If your total wealth stays at or above this for one full Hijri year, Zakat is due.' },
          { icon: Moon,  label: 'Hawl',   desc: 'One complete Hijri lunar year (approximately 354 days) of continuous ownership above Nisab. The Hawl must complete before Zakat becomes obligatory.' },
          { icon: Star,  label: 'Zakat Rate', desc: '2.5% of your total eligible wealth, calculated once per completed Hawl when both conditions (Nisab and Hawl) are simultaneously met.' },
        ],
      },
      {
        heading: 'Step 1 — Set Your Nisab Threshold',
        type: 'steps',
        items: [
          'Click the "Settings" button on the Zakat page',
          'Choose your silver price unit: per Gram or per Vori/Tola',
          'Enter the current market price of silver in Taka',
          'The system auto-calculates: Nisab = price × 612.36 grams (or × 52.5 Vori)',
          'Save — update this whenever you check silver prices for accuracy',
        ],
      },
      {
        heading: 'Step 2 — The Automatic Hawl Cycle',
        type: 'flow',
        items: [
          { label: 'Nisab Crossed — Cycle Starts', desc: 'System detects Total Wealth (sum of all accounts) ≥ Nisab. Cycle start date recorded in both Hijri and Gregorian calendars automatically.' },
          { label: 'Monitoring Period (354 days)', desc: 'Your wealth is monitored. It can rise and fall freely — no Zakat obligation is triggered mid-cycle regardless of fluctuations.' },
          { label: 'Hawl Assessment at Year End',  desc: 'After exactly one Hijri year: if wealth is still ≥ Nisab → Zakat is due (2.5% calculated). If wealth fell below Nisab → cycle ends, no obligation.' },
          { label: 'Payment and Renewal',          desc: 'Record your Zakat payment (full or instalments). When fully paid, if wealth is still above Nisab, a new cycle begins automatically from the payment date.' },
        ],
      },
      {
        heading: 'Zakat Status Indicators',
        type: 'list',
        items: [
          { icon: AlertCircle,  label: 'Not Mandatory',           desc: 'Total wealth is currently below Nisab threshold. No action needed — the system will alert you when this changes.' },
          { icon: Clock,        label: 'Monitoring Cycle Active', desc: 'Wealth is above Nisab. Hawl is running. Shows start date (Hijri and Gregorian), days elapsed, and days remaining.' },
          { icon: Star,         label: 'Zakat Due',               desc: 'One full Hijri year completed with wealth above Nisab. Shows the calculated 2.5% amount. Payment required.' },
        ],
      },
      {
        heading: 'Recording Zakat Payment',
        type: 'steps',
        items: [
          'When status shows "Zakat Due", the calculated amount (2.5% of wealth) is displayed prominently',
          'Click "Record Payment" to log how much you paid and on which date',
          'You can record partial payments — each reduces the outstanding Zakat amount',
          'When the full amount is paid, the cycle closes automatically',
          'If wealth remains above Nisab after payment, a new Hawl cycle begins immediately from the payment date',
          'All past cycles and payments are stored permanently in Cycle History',
        ],
      },
      {
        heading: 'Pro Tips',
        type: 'tips',
        items: [
          'Update your silver price setting monthly — an outdated Nisab figure can cause incorrect cycle triggers',
          'Total wealth for Zakat = ALL account balances combined (Cash + Bank + bKash + Gold + Silver)',
          'Consult a qualified Islamic scholar to determine which assets are zakatable in your specific situation',
          'The Hijri calendar is used internally for all date calculations — Gregorian equivalents are always displayed alongside',
          'Keep Gold and Silver accounts updated — they significantly affect total wealth and Nisab comparison',
          'Zakat on business goods, receivables, and other assets may also apply — discuss with a scholar',
        ],
      },
    ],
  },

  {
    id: 'analytics',
    icon: BarChart3,
    color: 'blue',
    title: 'Analytics',
    subtitle: 'Visual insights into your money',
    summary: 'Analytics transforms raw transactions into charts and summaries — income vs. expense comparisons, category breakdowns, and net saving trends over any time period.',
    sections: [
      {
        heading: 'Time Range Options',
        type: 'list',
        items: [
          { icon: Clock,      label: 'This Week',    desc: 'Current week (Saturday to Friday) — daily bar chart showing each day\'s income and expense' },
          { icon: Calendar,   label: 'This Month',   desc: 'Current calendar month — daily trend chart showing spending pattern across the month' },
          { icon: TrendingUp, label: 'This Year',    desc: 'All 12 months of the current year — monthly income vs. expense side by side' },
          { icon: Filter,     label: 'Custom Range', desc: 'Pick any start and end date — great for comparing specific periods like Ramadan vs. regular months' },
        ],
      },
      {
        heading: 'Charts and What They Show',
        type: 'list',
        items: [
          { icon: BarChart3,  label: 'Income vs. Expense Bar Chart', desc: 'Side-by-side bars across time periods. Immediately shows which months you saved and which you overspent.' },
          { icon: TrendingUp, label: 'Net Savings Line Chart',       desc: 'Trend line of income minus expenses over time. Upward = saving, downward = deficit.' },
          { icon: Target,     label: 'Category Expense Pie Chart',   desc: 'What percentage of total spending went to each category. Find your biggest cost drivers instantly.' },
        ],
      },
      {
        heading: 'How to Use Analytics Effectively',
        type: 'steps',
        items: [
          'Start with the Yearly view to understand your overall pattern — are you net positive or running a deficit?',
          'Zoom into a specific month where you overspent using the Monthly view — find which week caused it',
          'Open the Category Pie Chart to identify your biggest expense category — typically food, transport, or shopping',
          'Use Custom Range to compare two specific periods (e.g., before and after a lifestyle change)',
          'Use insights from Analytics to set realistic Budget limits in the Budgets section',
        ],
      },
      {
        heading: 'Transfers Are Always Excluded',
        type: 'callout',
        variant: 'info',
        content: 'Transfers between your own accounts never appear in Analytics income or expense figures. Only real income (money from outside your accounts) and real expenses (money leaving your control permanently) are charted — keeping the numbers truthful and useful.',
      },
      {
        heading: 'Pro Tips',
        type: 'tips',
        items: [
          'Analytics is only as good as your transaction recording — record consistently for meaningful charts',
          'More specific categories produce more useful pie charts — "Dining Out" is more actionable than just "Food"',
          'Monthly trend showing expense spikes? Use the filter to see exactly which category caused it',
          'Share the "This Year" view summary with yourself at year-end as a personal financial review',
        ],
      },
    ],
  },

  {
    id: 'recurring',
    icon: Repeat,
    color: 'cyan',
    title: 'Recurring Transactions',
    subtitle: 'Automate fixed income and expenses',
    summary: 'Recurring Transactions auto-generates any fixed, repeating payment — salary, rent, subscriptions, utility bills — so you never forget to record them manually.',
    sections: [
      {
        heading: 'What Recurring Does',
        type: 'text',
        content: 'Instead of manually entering the same transaction every month, you create one Recurring rule. On each due date, the system generates the transaction automatically — updating your account balance and showing in the transaction list exactly like a manual entry. Nothing is missed.',
      },
      {
        heading: 'Frequency Options',
        type: 'list',
        items: [
          { icon: Calendar, label: 'Daily',   desc: 'Runs every day — e.g., a daily transport allowance or daily savings deposit' },
          { icon: Calendar, label: 'Weekly',  desc: 'Runs on a chosen day each week — e.g., weekly pocket money' },
          { icon: Calendar, label: 'Monthly', desc: 'Runs on a chosen date each month — ideal for rent, salary, EMI payments' },
          { icon: Calendar, label: 'Yearly',  desc: 'Annual transactions — insurance premiums, domain renewals, memberships' },
        ],
      },
      {
        heading: 'Creating a Recurring Transaction',
        type: 'steps',
        items: [
          'Click "Add Recurring" and give it a descriptive name (e.g., "Monthly House Rent")',
          'Choose type: Income or Expense',
          'Enter the fixed amount',
          'Select the account and category',
          'Set the frequency and the specific day (day of week for weekly, date of month for monthly)',
          'Set the start date — the first auto-execution date is shown immediately',
          'Optionally set an end date if it will stop (e.g., loan EMI ending in 18 months)',
          'Choose approval mode: Auto (fires silently) or Manual Approval (you confirm each time)',
          'Save — the recurring entry is live from the next due date',
        ],
      },
      {
        heading: 'Auto vs. Manual Approval Mode',
        type: 'callout',
        variant: 'info',
        content: 'Auto mode: transaction executes silently on the due date — ideal for truly fixed amounts like rent that never change. Manual Approval mode: creates a Pending entry on the due date that you must approve or skip — ideal for bills that vary slightly each month like electricity or gas.',
      },
      {
        heading: 'Managing Recurring Entries',
        type: 'list',
        items: [
          { icon: Clock,     label: 'Pause',   desc: 'Suspend a recurring temporarily — stops executing but rule is preserved. Resume any time.' },
          { icon: RefreshCw, label: 'Resume',  desc: 'Reactivate a paused recurring — next execution date recalculates from today forward' },
          { icon: Edit2,     label: 'Edit',    desc: 'Change amount, account, category, frequency, or schedule at any time' },
          { icon: Trash2,    label: 'Delete',  desc: 'Permanently removes the rule — past transactions it already created remain in history' },
        ],
      },
      {
        heading: 'Pending Approvals',
        type: 'text',
        content: 'Recurring entries in Manual Approval mode generate Pending logs. These appear with a notification count in the Recurring menu. Open the Pending section to approve (execute the transaction) or skip (dismiss without recording) each one.',
      },
      {
        heading: 'Pro Tips',
        type: 'tips',
        items: [
          'The system processes due recurring transactions when you open the Recurring page — visit at least weekly',
          'If the app is closed for several days, all overdue recurring entries are queued and processed together when you return',
          'Use Manual Approval for utility bills so you can enter the actual amount each month before approving',
          'Pending approval count shows as a badge on the Recurring menu item — you will not miss them',
          'Set an end date for EMI recurrings so they stop automatically — no manual deletion needed',
        ],
      },
    ],
  },

  {
    id: 'shopping',
    icon: ShoppingBag,
    color: 'pink',
    title: 'Shopping List',
    subtitle: 'Plan purchases before you spend',
    summary: 'Create smart shopping lists with item prices before going to the market. Track what you buy, compare estimated vs. actual costs, and stay within your budget every time.',
    sections: [
      {
        heading: 'How Shopping Lists Work',
        type: 'text',
        content: 'You create a Cart (e.g., "Weekly Groceries" or "Eid Shopping 2026"), then add individual items with names, quantities, and estimated prices. As you shop, tick items off. The app shows your estimated total vs. what you have purchased so far — a live spending tracker in your pocket at the market.',
      },
      {
        heading: 'Creating a New Cart',
        type: 'steps',
        items: [
          'Click "New List" on the Shopping List page',
          'Give the cart a clear name (e.g., "Monthly Market Run" or "Office Supplies")',
          'Add an optional description or purpose',
          'Save — the cart appears on the Shopping List dashboard',
          'Click the cart to open it and start adding items',
        ],
      },
      {
        heading: 'Adding Items and Shopping',
        type: 'steps',
        items: [
          'Inside the cart, click "Add Item" and enter the item name',
          'Set the quantity and estimated price per unit',
          'The cart shows a running estimated total of all items',
          'As you shop, tick each item off — it moves to the Purchased section',
          'The purchased subtotal updates live — you always know where you stand',
          'When done, note the actual receipt total vs. estimated and record it as an Expense transaction',
        ],
      },
      {
        heading: 'Cart Statuses',
        type: 'list',
        items: [
          { icon: Clock,        label: 'Pending',   desc: 'Shopping not yet complete — items remain in the To Buy section' },
          { icon: CheckCircle2, label: 'Completed', desc: 'All items have been ticked off — shopping done for this cart' },
        ],
      },
      {
        heading: 'Pro Tips',
        type: 'tips',
        items: [
          'Create separate carts for different trip types — weekly groceries, Eid shopping, household supplies, electronics',
          'Add estimated prices before going to the market to check if the total fits your budget before you leave home',
          'Keep a rolling "Next Month" cart and add items throughout the month as you remember them',
          'Compare the estimated cart total with your actual receipt total — a great habit for improving your budgeting accuracy over time',
          'Completed carts are archived — refer back to them to see what you spent on previous shopping trips',
        ],
      },
    ],
  },

  {
    id: 'tax',
    icon: FileText,
    color: 'slate',
    title: 'Tax File',
    subtitle: 'Organise income for annual returns',
    summary: 'Tax File organises your income transactions by fiscal year and maps them to official tax heads — giving you a structured, ready-to-use summary for your annual income tax return.',
    sections: [
      {
        heading: 'Who Needs the Tax File Feature',
        type: 'text',
        content: 'If you file an annual income tax return in Bangladesh, Tax File does the preparation work. It reads your income transactions, groups them by fiscal year (July 1 to June 30), maps them to the correct tax income heads, and produces a clean summary — saving hours of manual data gathering.',
      },
      {
        heading: 'Step 1 — Set Up Category Mappings (Do This First)',
        type: 'steps',
        items: [
          'Go to Tax → click "Setup Categories" or "Category Mapping"',
          'Your existing income categories appear in the list',
          'Map each category to the correct official tax head',
          'Example: "Salary" → Salaries; "Freelance" → Business/Profession Income; "Rental" → House Property Income',
          'Save mappings — they apply permanently to all tax year calculations going forward',
        ],
      },
      {
        heading: 'Step 2 — Create a Tax Year',
        type: 'steps',
        items: [
          'Click "Create Tax Year" — the current fiscal year is pre-selected',
          'The system pulls all income transactions whose categories are mapped to tax heads',
          'Income is automatically grouped by tax head with running totals',
          'A countdown shows days remaining until the November 30 filing deadline',
          'Click into the tax year to review the complete breakdown by category and month',
        ],
      },
      {
        heading: 'Tax Year Status',
        type: 'list',
        items: [
          { icon: Clock,        label: 'In Progress', desc: 'Current fiscal year — income continues accumulating. Deadline: November 30.' },
          { icon: AlertCircle,  label: 'Due Soon',    desc: 'Less than 30 days to the filing deadline — time to act' },
          { icon: CheckCircle2, label: 'Filed',       desc: 'You have marked this tax year as submitted — stored as a permanent reference' },
        ],
      },
      {
        heading: 'Export for Your Accountant',
        type: 'callout',
        variant: 'info',
        content: 'Each tax year can be exported as a structured income summary. Use it as a reference when filling your return form, or share it directly with your tax consultant or CA to save them hours of work extracting figures from raw bank statements.',
      },
      {
        heading: 'Pro Tips',
        type: 'tips',
        items: [
          'Set up category mappings at the start of the fiscal year (July) — the system tracks everything automatically from that point',
          'Only Income-type transactions feed the Tax File — Expense transactions are not included',
          'Bangladesh fiscal year is July 1 to June 30 — Nisab Wallet uses this automatically, no configuration needed',
          'Even if you use a tax consultant, Tax File saves significant time in organising and presenting your income data',
          'Unmapped income categories will not appear in Tax File totals — check mappings if figures look incomplete',
        ],
      },
    ],
  },
];

// ─── Color styles ─────────────────────────────────────────────────────────────
const C = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: 'bg-blue-100 text-blue-700',    active: 'bg-blue-700 text-white',    dot: 'bg-blue-600'    },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  icon: 'bg-violet-100 text-violet-700',  active: 'bg-violet-700 text-white',  dot: 'bg-violet-600'  },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-700', active: 'bg-emerald-700 text-white', dot: 'bg-emerald-600' },
  cyan:    { bg: 'bg-cyan-50',    border: 'border-cyan-200',    icon: 'bg-cyan-100 text-cyan-700',    active: 'bg-cyan-700 text-white',    dot: 'bg-cyan-600'    },
  teal:    { bg: 'bg-teal-50',    border: 'border-teal-200',    icon: 'bg-teal-100 text-teal-700',    active: 'bg-teal-700 text-white',    dot: 'bg-teal-600'    },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-200',  icon: 'bg-orange-100 text-orange-700',  active: 'bg-orange-600 text-white',  dot: 'bg-orange-500'  },
  rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    icon: 'bg-rose-100 text-rose-700',    active: 'bg-rose-700 text-white',    dot: 'bg-rose-600'    },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'bg-amber-100 text-amber-700',   active: 'bg-amber-600 text-white',   dot: 'bg-amber-500'   },
  green:   { bg: 'bg-green-50',   border: 'border-green-200',   icon: 'bg-green-100 text-green-700',   active: 'bg-green-700 text-white',   dot: 'bg-green-600'   },
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  icon: 'bg-indigo-100 text-indigo-700',  active: 'bg-indigo-700 text-white',  dot: 'bg-indigo-600'  },
  pink:    { bg: 'bg-pink-50',    border: 'border-pink-200',    icon: 'bg-pink-100 text-pink-700',    active: 'bg-pink-700 text-white',    dot: 'bg-pink-600'    },
  slate:   { bg: 'bg-slate-50',   border: 'border-slate-200',   icon: 'bg-slate-100 text-slate-700',   active: 'bg-slate-700 text-white',   dot: 'bg-slate-600'   },
};

// ─── Section renderers ────────────────────────────────────────────────────────
function SectionText({ content }) {
  return <p className="text-sm text-gray-700 leading-relaxed">{content}</p>;
}

function SectionList({ items }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
            {Icon && (
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={14} className="text-gray-600" />
              </div>
            )}
            <div>
              <div className="text-sm font-semibold text-gray-900">{item.label}</div>
              {item.desc && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionSteps({ items }) {
  return (
    <ol className="space-y-3">
      {items.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{step}</p>
        </li>
      ))}
    </ol>
  );
}

function SectionFlow({ items }) {
  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center self-stretch">
            <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-1.5 ring-2 ring-blue-100" />
            {i < items.length - 1 && <div className="w-0.5 bg-blue-200 flex-1 mt-1" style={{ minHeight: 28 }} />}
          </div>
          <div className="pb-4">
            <div className="text-sm font-semibold text-gray-900">{item.label}</div>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionCallout({ content, variant }) {
  const styles = {
    info:    { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: <Info size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />,          text: 'text-blue-900'    },
    warning: { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />,   text: 'text-amber-900'   },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />, text: 'text-emerald-900' },
  };
  const s = styles[variant] || styles.info;
  return (
    <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border ${s.bg} ${s.border}`}>
      {s.icon}
      <p className={`text-sm leading-relaxed ${s.text}`}>{content}</p>
    </div>
  );
}

function SectionTips({ items }) {
  return (
    <ul className="space-y-2.5">
      {items.map((tip, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <Lightbulb size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
        </li>
      ))}
    </ul>
  );
}

function GuideSection({ section }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/80 hover:bg-gray-100 transition-colors text-left gap-2"
      >
        <span className="text-sm font-semibold text-gray-800">{section.heading}</span>
        {open
          ? <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
          : <ChevronRight size={15} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 py-4 bg-white">
          {section.type === 'text'    && <SectionText content={section.content} />}
          {section.type === 'list'    && <SectionList items={section.items} />}
          {section.type === 'steps'   && <SectionSteps items={section.items} />}
          {section.type === 'flow'    && <SectionFlow items={section.items} />}
          {section.type === 'callout' && <SectionCallout content={section.content} variant={section.variant} />}
          {section.type === 'tips'    && <SectionTips items={section.items} />}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UserGuidePage() {
  const [activeId, setActiveId] = useState('accounts');
  const [search, setSearch] = useState('');

  const activeGuide = GUIDES.find(g => g.id === activeId);
  const c = C[activeGuide?.color] || C.blue;

  const filtered = search.trim()
    ? GUIDES.filter(g =>
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.subtitle.toLowerCase().includes(search.toLowerCase()) ||
        g.summary.toLowerCase().includes(search.toLowerCase())
      )
    : GUIDES;

  const selectGuide = (id) => { setActiveId(id); setSearch(''); };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
            <BookOpen size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">User Guide</h1>
            <p className="text-sm text-gray-500">Complete workflow guides for every feature</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <aside className="lg:w-60 flex-shrink-0">
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search guides…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
            />
          </div>

          <nav className="space-y-0.5">
            {filtered.map(guide => {
              const Icon = guide.icon;
              const gc = C[guide.color] || C.blue;
              const isActive = activeId === guide.id && !search;
              return (
                <button
                  key={guide.id}
                  onClick={() => selectGuide(guide.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive ? `${gc.active} shadow-sm` : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/25' : gc.icon}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold truncate ${isActive ? '' : 'text-gray-900'}`}>{guide.title}</div>
                    <div className={`text-[10px] truncate leading-tight ${isActive ? 'opacity-75' : 'text-gray-400'}`}>{guide.subtitle}</div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">No guides match</p>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {search.trim() ? (
            <div className="space-y-2.5">
              <p className="text-xs text-gray-400 mb-3">{filtered.length} guide{filtered.length !== 1 ? 's' : ''} found</p>
              {filtered.map(guide => {
                const Icon = guide.icon;
                const gc = C[guide.color] || C.blue;
                return (
                  <button
                    key={guide.id}
                    onClick={() => selectGuide(guide.id)}
                    className={`w-full text-left p-4 rounded-xl border ${gc.border} ${gc.bg} hover:shadow-sm transition-all flex items-start gap-3`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${gc.icon}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{guide.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{guide.subtitle}</div>
                      <div className="text-xs text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">{guide.summary}</div>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 flex-shrink-0 mt-1" />
                  </button>
                );
              })}
            </div>
          ) : activeGuide ? (
            <div>
              {/* Guide header card */}
              <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-6 mb-4`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
                    <activeGuide.icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">Feature Guide</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-0.5">{activeGuide.title}</h2>
                    <p className="text-sm text-gray-500 mb-3">{activeGuide.subtitle}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{activeGuide.summary}</p>
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-2">
                {activeGuide.sections.map((section, i) => (
                  <GuideSection key={i} section={section} />
                ))}
              </div>

              {/* Prev / Next navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                {(() => {
                  const idx = GUIDES.findIndex(g => g.id === activeId);
                  const prev = GUIDES[idx - 1];
                  const next = GUIDES[idx + 1];
                  return (
                    <>
                      {prev ? (
                        <button onClick={() => selectGuide(prev.id)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                          <ChevronRight size={14} className="rotate-180" />
                          <span>{prev.title}</span>
                        </button>
                      ) : <div />}
                      {next ? (
                        <button onClick={() => selectGuide(next.id)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                          <span>{next.title}</span>
                          <ChevronRight size={14} />
                        </button>
                      ) : <div />}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}