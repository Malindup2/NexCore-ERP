"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react"

interface Account {
  id: number
  accountCode: string
  name: string
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
  balance: number
}

interface Transaction {
  id: number
  date: string
  description: string
  debit: number
  credit: number
  account: string
}

const mockAccounts: Account[] = [
  { id: 1, accountCode: "1000", name: "Cash", type: "Asset", balance: 41250000 },
  { id: 2, accountCode: "1200", name: "Accounts Receivable", type: "Asset", balance: 14850000 },
  { id: 3, accountCode: "1500", name: "Inventory", type: "Asset", balance: 28875000 },
  { id: 4, accountCode: "2000", name: "Accounts Payable", type: "Liability", balance: 10560000 },
  { id: 5, accountCode: "3000", name: "Owner's Equity", type: "Equity", balance: 49500000 },
  { id: 6, accountCode: "4000", name: "Sales Revenue", type: "Revenue", balance: 80850000 },
  { id: 7, accountCode: "5000", name: "Operating Expenses", type: "Expense", balance: 25740000 },
]

const mockTransactions: Transaction[] = [
  { id: 1, date: "2025-12-08", description: "Customer Payment", debit: 1650000, credit: 0, account: "Cash" },
  { id: 2, date: "2025-12-08", description: "Sales Invoice #001", debit: 0, credit: 1650000, account: "Sales Revenue" },
  { id: 3, date: "2025-12-07", description: "Office Supplies", debit: 82500, credit: 0, account: "Operating Expenses" },
  { id: 4, date: "2025-12-07", description: "Supplier Payment", debit: 0, credit: 82500, account: "Cash" },
]

export default function AccountingPage() {
  const [accounts] = useState<Account[]>(mockAccounts)
  const [transactions] = useState<Transaction[]>(mockTransactions)

  const totalAssets = accounts.filter(a => a.type === "Asset").reduce((sum, a) => sum + a.balance, 0)
  const totalLiabilities = accounts.filter(a => a.type === "Liability").reduce((sum, a) => sum + a.balance, 0)
  const totalRevenue = accounts.filter(a => a.type === "Revenue").reduce((sum, a) => sum + a.balance, 0)
  const totalExpenses = accounts.filter(a => a.type === "Expense").reduce((sum, a) => sum + a.balance, 0)
  const netIncome = totalRevenue - totalExpenses

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
          <p className="text-muted-foreground">Financial management and reporting</p>
        </div>
        <Button>New Transaction</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {totalAssets.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current asset value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">LKR {totalLiabilities.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Outstanding liabilities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">LKR {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Year to date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {netIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chart of Accounts</CardTitle>
              <CardDescription>All active accounts in your system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono">{account.accountCode}</TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>
                        <Badge variant={
                          account.type === "Asset" ? "default" :
                          account.type === "Revenue" ? "success" :
                          account.type === "Liability" ? "destructive" :
                          account.type === "Expense" ? "warning" :
                          "secondary"
                        }>
                          {account.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        LKR {account.balance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest journal entries</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>{transaction.account}</TableCell>
                      <TableCell className="text-right">
                        {transaction.debit > 0 ? `$${transaction.debit.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.credit > 0 ? `$${transaction.credit.toLocaleString()}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
                <CardDescription>Financial position summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold">Assets</span>
                    <span className="font-bold">${totalAssets.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold">Liabilities</span>
                    <span className="font-bold text-red-500">${totalLiabilities.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold">Equity</span>
                    <span className="font-bold">${(totalAssets - totalLiabilities).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income Statement</CardTitle>
                <CardDescription>Profit and loss summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold">Revenue</span>
                    <span className="font-bold text-green-500">${totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold">Expenses</span>
                    <span className="font-bold text-red-500">${totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold">Net Income</span>
                    <span className="font-bold">${netIncome.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
