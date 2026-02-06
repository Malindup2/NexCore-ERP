"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"

interface Account {
  id: number
  accountCode: string
  name: string
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
  balance: number
}

interface JournalEntry {
  id: number
  date: string
  description: string
  referenceId: string
  lines: JournalEntryLine[]
}

interface JournalEntryLine {
  id: number
  journalEntryId: number
  accountId: number
  account?: Account
  debit: number
  credit: number
}

export default function AccountingPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    if (userRole !== "Admin" && userRole !== "Accountant") {
      router.push("/")
      return
    }
    fetchAccountingData()
  }, [router])

  const fetchAccountingData = async () => {
    try {
      const [accountsRes, entriesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/accounting/Accounts`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/accounting/JournalEntries`).then(r => r.json())
      ])
      setAccounts(accountsRes)
      setJournalEntries(entriesRes)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching accounting data:", error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalAssets = accounts.filter(a => a.type === "Asset").reduce((sum, a) => sum + a.balance, 0)
  const totalLiabilities = accounts.filter(a => a.type === "Liability").reduce((sum, a) => sum + a.balance, 0)
  const totalRevenue = accounts.filter(a => a.type === "Revenue").reduce((sum, a) => sum + a.balance, 0)
  const totalExpenses = accounts.filter(a => a.type === "Expense").reduce((sum, a) => sum + a.balance, 0)
  const netIncome = totalRevenue - totalExpenses

  // Get recent journal entry lines for display
  const recentTransactions = journalEntries
    .slice(0, 10)
    .flatMap(entry => 
      entry.lines.map(line => ({
        id: `${entry.id}-${line.id}`,
        date: entry.date,
        description: entry.description,
        account: line.account?.name || "Unknown",
        debit: line.debit,
        credit: line.credit
      }))
    )

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
          <p className="text-muted-foreground">Financial management and reporting</p>
        </div>
        <Button onClick={() => router.push("/accounting/journal-entry")}>
          <Plus className="mr-2 h-4 w-4" />
          New Journal Entry
        </Button>
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
              {accounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No accounts found
                </div>
              ) : (
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
                            account.type === "Revenue" ? "default" :
                            account.type === "Liability" ? "destructive" :
                            account.type === "Expense" ? "outline" :
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
              )}
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
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found
                </div>
              ) : (
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
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{transaction.description}</TableCell>
                        <TableCell>{transaction.account}</TableCell>
                        <TableCell className="text-right">
                          {transaction.debit > 0 ? `LKR ${transaction.debit.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.credit > 0 ? `LKR ${transaction.credit.toLocaleString()}` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
                    <span className="font-bold">LKR {totalAssets.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold">Liabilities</span>
                    <span className="font-bold text-red-500">LKR {totalLiabilities.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold">Equity</span>
                    <span className="font-bold">LKR {(totalAssets - totalLiabilities).toLocaleString()}</span>
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
                    <span className="font-bold text-green-500">LKR {totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold">Expenses</span>
                    <span className="font-bold text-red-500">LKR {totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold">Net Income</span>
                    <span className="font-bold">LKR {netIncome.toLocaleString()}</span>
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
