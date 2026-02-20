// src/lib/taxExporter.js

/**
 * Tax Export Utilities
 * Generates IT-10BB, IT-10BB2, and Excel exports
 */

import { getTaxCategoryById } from './taxCategories';

/**
 * Generate IT-10BB (Expenditure Statement) HTML
 */
export const generateIT10BB = (taxYear, expenseAnalysis, taxpayerInfo = {}) => {
  const { taxpayerName = 'Taxpayer Name', tin = 'TIN Number' } = taxpayerInfo;
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>IT-10BB - Income Year ${taxYear.incomeYear}</title>
  <style>
    body {
      font-family: 'SolaimanLipi', Arial, sans-serif;
      margin: 40px;
      font-size: 12px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 18px;
      margin: 5px 0;
    }
    .header h2 {
      font-size: 14px;
      margin: 5px 0;
      font-weight: normal;
    }
    .info-section {
      margin: 20px 0;
    }
    .info-row {
      margin: 5px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .amount {
      text-align: right;
    }
    .section-title {
      background-color: #e0e0e0;
      font-weight: bold;
    }
    .total-row {
      font-weight: bold;
      background-color: #f5f5f5;
    }
    .footer {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .signature {
      text-align: center;
      margin-top: 50px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Government of the People's Republic of Bangladesh</h1>
    <h1>National Board of Revenue</h1>
    <h2>IT-10BB</h2>
    <h2>Statement of Expenses (Expenditure)</h2>
    <h2>Income Year: ${taxYear.incomeYear}</h2>
  </div>

  <div class="info-section">
    <div class="info-row"><strong>Name of Taxpayer:</strong> ${taxpayerName}</div>
    <div class="info-row"><strong>TIN:</strong> ${tin}</div>
    <div class="info-row"><strong>Assessment Year:</strong> ${taxYear.taxYear}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 10%;">S/L</th>
        <th style="width: 50%;">Particulars</th>
        <th style="width: 20%;">NBR Code</th>
        <th style="width: 20%;">Amount (৳)</th>
      </tr>
    </thead>
    <tbody>
`;

  // Schedule A: Personal & Family Expenses
  html += `
      <tr class="section-title">
        <td colspan="4">Schedule A: Personal & Family Expenses</td>
      </tr>
`;

  let serial = 1;
  let personalTotal = 0;
  Object.entries(expenseAnalysis.personal || {}).forEach(([categoryId, amount]) => {
    const cat = getTaxCategoryById(categoryId);
    if (cat) {
      html += `
      <tr>
        <td>${serial++}</td>
        <td>${cat.name}</td>
        <td>${cat.nbrCode}</td>
        <td class="amount">${amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
      </tr>
`;
      personalTotal += amount;
    }
  });

  html += `
      <tr class="total-row">
        <td colspan="3">Total Personal & Family Expenses</td>
        <td class="amount">${personalTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
      </tr>
`;

  // Schedule B: Tax Paid
  html += `
      <tr class="section-title">
        <td colspan="4">Schedule B: Tax Paid</td>
      </tr>
`;

  let taxTotal = 0;
  Object.entries(expenseAnalysis.taxPaid || {}).forEach(([categoryId, amount]) => {
    const cat = getTaxCategoryById(categoryId);
    if (cat) {
      html += `
      <tr>
        <td>${serial++}</td>
        <td>${cat.name}</td>
        <td>${cat.nbrCode}</td>
        <td class="amount">${amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
      </tr>
`;
      taxTotal += amount;
    }
  });

  html += `
      <tr class="total-row">
        <td colspan="3">Total Tax Paid</td>
        <td class="amount">${taxTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
      </tr>
`;

  // Schedule C: Investments
  html += `
      <tr class="section-title">
        <td colspan="4">Schedule C: Investments/Savings</td>
      </tr>
`;

  let investmentTotal = 0;
  Object.entries(expenseAnalysis.investments || {}).forEach(([categoryId, amount]) => {
    const cat = getTaxCategoryById(categoryId);
    if (cat) {
      html += `
      <tr>
        <td>${serial++}</td>
        <td>${cat.name}</td>
        <td>${cat.nbrCode}</td>
        <td class="amount">${amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
      </tr>
`;
      investmentTotal += amount;
    }
  });

  html += `
      <tr class="total-row">
        <td colspan="3">Total Investments/Savings</td>
        <td class="amount">${investmentTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
      </tr>
`;

  // Schedule D: Loan Repayment
  html += `
      <tr class="section-title">
        <td colspan="4">Schedule D: Loan Repayment</td>
      </tr>
`;

  let loanTotal = 0;
  Object.entries(expenseAnalysis.loanRepayment || {}).forEach(([categoryId, amount]) => {
    const cat = getTaxCategoryById(categoryId);
    if (cat) {
      html += `
      <tr>
        <td>${serial++}</td>
        <td>${cat.name}</td>
        <td>${cat.nbrCode}</td>
        <td class="amount">${amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
      </tr>
`;
      loanTotal += amount;
    }
  });

  html += `
      <tr class="total-row">
        <td colspan="3">Total Loan Repayment</td>
        <td class="amount">${loanTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
      </tr>
`;

  // Grand Total
  const grandTotal = personalTotal + taxTotal + investmentTotal + loanTotal;
  html += `
      <tr class="total-row" style="background-color: #d0d0d0;">
        <td colspan="3"><strong>GRAND TOTAL EXPENDITURE</strong></td>
        <td class="amount"><strong>${grandTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</strong></td>
      </tr>
`;

  html += `
    </tbody>
  </table>

  <div class="signature">
    <div style="margin-top: 80px;">
      <div>_____________________________</div>
      <div>Signature of Taxpayer</div>
      <div>Date: _______________</div>
    </div>
  </div>

  <div style="margin-top: 30px; font-size: 10px; color: #666;">
    <p><strong>Note:</strong> This statement is generated from your personal finance application. 
    Please review all figures carefully before submission to NBR.</p>
  </div>
</body>
</html>
`;

  return html;
};

/**
 * Generate IT-10BB2 (Assets & Liabilities Statement) HTML
 */
export const generateIT10BB2 = (taxYear, assets = [], liabilities = [], accounts = [], taxpayerInfo = {}) => {
  const { taxpayerName = 'Taxpayer Name', tin = 'TIN Number' } = taxpayerInfo;
  
  // Calculate totals
  const totalAssets = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  const totalAccounts = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + (l.principal || 0), 0);
  const netWorth = (totalAssets + totalAccounts) - totalLiabilities;

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>IT-10BB2 - Income Year ${taxYear.incomeYear}</title>
  <style>
    body {
      font-family: 'SolaimanLipi', Arial, sans-serif;
      margin: 40px;
      font-size: 12px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 18px;
      margin: 5px 0;
    }
    .header h2 {
      font-size: 14px;
      margin: 5px 0;
      font-weight: normal;
    }
    .info-section {
      margin: 20px 0;
    }
    .info-row {
      margin: 5px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .amount {
      text-align: right;
    }
    .section-title {
      background-color: #e0e0e0;
      font-weight: bold;
    }
    .total-row {
      font-weight: bold;
      background-color: #f5f5f5;
    }
    .grand-total {
      font-weight: bold;
      background-color: #d0d0d0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Government of the People's Republic of Bangladesh</h1>
    <h1>National Board of Revenue</h1>
    <h2>IT-10BB2</h2>
    <h2>Statement of Assets and Liabilities</h2>
    <h2>Income Year: ${taxYear.incomeYear}</h2>
  </div>

  <div class="info-section">
    <div class="info-row"><strong>Name of Taxpayer:</strong> ${taxpayerName}</div>
    <div class="info-row"><strong>TIN:</strong> ${tin}</div>
    <div class="info-row"><strong>Assessment Year:</strong> ${taxYear.taxYear}</div>
  </div>

  <h3>Part A: Assets</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 10%;">S/L</th>
        <th style="width: 30%;">Asset Type</th>
        <th style="width: 40%;">Description</th>
        <th style="width: 20%;">Value (৳)</th>
      </tr>
    </thead>
    <tbody>
`;

  // Cash & Bank Accounts
  html += `
      <tr class="section-title">
        <td colspan="4">Cash & Bank Balance</td>
      </tr>
`;

  let serial = 1;
  accounts.forEach(account => {
    html += `
      <tr>
        <td>${serial++}</td>
        <td>${account.type || 'Account'}</td>
        <td>${account.name}</td>
        <td class="amount">${(account.balance || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
      </tr>
`;
  });

  html += `
      <tr class="total-row">
        <td colspan="3">Total Cash & Bank</td>
        <td class="amount">${totalAccounts.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
      </tr>
`;

  // Other Assets
  html += `
      <tr class="section-title">
        <td colspan="4">Other Assets</td>
      </tr>
`;

  assets.forEach(asset => {
    const cat = getTaxCategoryById(asset.assetType);
    html += `
      <tr>
        <td>${serial++}</td>
        <td>${cat?.name || asset.assetType}</td>
        <td>${asset.description}</td>
        <td class="amount">${(asset.currentValue || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
      </tr>
`;
  });

  html += `
      <tr class="total-row">
        <td colspan="3">Total Other Assets</td>
        <td class="amount">${totalAssets.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr class="grand-total">
        <td colspan="3"><strong>TOTAL ASSETS</strong></td>
        <td class="amount"><strong>${(totalAssets + totalAccounts).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</strong></td>
      </tr>
`;

  html += `
    </tbody>
  </table>

  <h3>Part B: Liabilities</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 10%;">S/L</th>
        <th style="width: 30%;">Liability Type</th>
        <th style="width: 40%;">Description</th>
        <th style="width: 20%;">Amount (৳)</th>
      </tr>
    </thead>
    <tbody>
`;

  serial = 1;
  liabilities.forEach(liability => {
    const cat = getTaxCategoryById(liability.liabilityType);
    html += `
      <tr>
        <td>${serial++}</td>
        <td>${cat?.name || liability.liabilityType}</td>
        <td>${liability.description}${liability.lender ? ` (${liability.lender})` : ''}</td>
        <td class="amount">${(liability.principal || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
      </tr>
`;
  });

  if (liabilities.length === 0) {
    html += `
      <tr>
        <td colspan="4" style="text-align: center; padding: 20px;">No liabilities recorded</td>
      </tr>
`;
  }

  html += `
      <tr class="grand-total">
        <td colspan="3"><strong>TOTAL LIABILITIES</strong></td>
        <td class="amount"><strong>${totalLiabilities.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</strong></td>
      </tr>
`;

  html += `
    </tbody>
  </table>

  <h3>Summary</h3>
  <table>
    <tbody>
      <tr>
        <td style="width: 70%;"><strong>Total Assets</strong></td>
        <td class="amount" style="width: 30%;"><strong>${(totalAssets + totalAccounts).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</strong></td>
      </tr>
      <tr>
        <td><strong>Total Liabilities</strong></td>
        <td class="amount"><strong>${totalLiabilities.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</strong></td>
      </tr>
      <tr class="grand-total">
        <td><strong>NET WORTH (Assets - Liabilities)</strong></td>
        <td class="amount"><strong>${netWorth.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="signature" style="text-align: center; margin-top: 80px;">
    <div>_____________________________</div>
    <div>Signature of Taxpayer</div>
    <div>Date: _______________</div>
  </div>

  <div style="margin-top: 30px; font-size: 10px; color: #666;">
    <p><strong>Note:</strong> This statement is generated from your personal finance application. 
    Please review all figures carefully before submission to NBR.</p>
  </div>
</body>
</html>
`;

  return html;
};

/**
 * Download HTML as PDF (opens print dialog)
 */
export const downloadAsPDF = (html, filename) => {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, '_blank');
  
  if (newWindow) {
    newWindow.onload = () => {
      setTimeout(() => {
        newWindow.print();
      }, 500);
    };
  }
};

/**
 * Generate Excel CSV data
 */
export const generateExcelData = (taxYear, incomeAnalysis, expenseAnalysis, assets, liabilities, accounts) => {
  let csv = '';

  // Header
  csv += `Tax Report - Income Year ${taxYear.incomeYear}\n`;
  csv += `Assessment Year: ${taxYear.taxYear}\n`;
  csv += `Generated: ${new Date().toLocaleDateString()}\n\n`;

  // Summary
  csv += `SUMMARY\n`;
  csv += `Total Income,৳${incomeAnalysis.totalIncome.toLocaleString()}\n`;
  csv += `Total Expenses,৳${expenseAnalysis.totalExpenses.toLocaleString()}\n`;
  csv += `Savings,৳${(incomeAnalysis.totalIncome - expenseAnalysis.totalExpenses).toLocaleString()}\n\n`;

  // Income Breakdown
  csv += `INCOME BREAKDOWN\n`;
  csv += `Category,NBR Code,Amount\n`;
  Object.entries(incomeAnalysis.income || {}).forEach(([categoryId, amount]) => {
    const cat = getTaxCategoryById(categoryId);
    csv += `${cat?.name || categoryId},${cat?.nbrCode || ''},৳${amount.toLocaleString()}\n`;
  });
  csv += `\n`;

  // Expense Breakdown
  csv += `EXPENSE BREAKDOWN\n`;
  csv += `Category,NBR Code,Amount\n`;
  
  // Personal Expenses
  csv += `Personal & Family Expenses\n`;
  Object.entries(expenseAnalysis.personal || {}).forEach(([categoryId, amount]) => {
    const cat = getTaxCategoryById(categoryId);
    csv += `${cat?.name || categoryId},${cat?.nbrCode || ''},৳${amount.toLocaleString()}\n`;
  });
  
  csv += `\nTax Paid\n`;
  Object.entries(expenseAnalysis.taxPaid || {}).forEach(([categoryId, amount]) => {
    const cat = getTaxCategoryById(categoryId);
    csv += `${cat?.name || categoryId},${cat?.nbrCode || ''},৳${amount.toLocaleString()}\n`;
  });
  
  csv += `\nInvestments\n`;
  Object.entries(expenseAnalysis.investments || {}).forEach(([categoryId, amount]) => {
    const cat = getTaxCategoryById(categoryId);
    csv += `${cat?.name || categoryId},${cat?.nbrCode || ''},৳${amount.toLocaleString()}\n`;
  });
  
  csv += `\nLoan Repayment\n`;
  Object.entries(expenseAnalysis.loanRepayment || {}).forEach(([categoryId, amount]) => {
    const cat = getTaxCategoryById(categoryId);
    csv += `${cat?.name || categoryId},${cat?.nbrCode || ''},৳${amount.toLocaleString()}\n`;
  });
  csv += `\n`;

  // Assets
  csv += `ASSETS\n`;
  csv += `Type,Description,Value\n`;
  accounts.forEach(account => {
    csv += `${account.type},${account.name},৳${(account.balance || 0).toLocaleString()}\n`;
  });
  assets.forEach(asset => {
    const cat = getTaxCategoryById(asset.assetType);
    csv += `${cat?.name || asset.assetType},${asset.description},৳${(asset.currentValue || 0).toLocaleString()}\n`;
  });
  csv += `\n`;

  // Liabilities
  csv += `LIABILITIES\n`;
  csv += `Type,Description,Amount\n`;
  liabilities.forEach(liability => {
    const cat = getTaxCategoryById(liability.liabilityType);
    csv += `${cat?.name || liability.liabilityType},${liability.description},৳${(liability.principal || 0).toLocaleString()}\n`;
  });

  return csv;
};

/**
 * Download CSV as Excel file
 */
export const downloadAsExcel = (csvData, filename) => {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};