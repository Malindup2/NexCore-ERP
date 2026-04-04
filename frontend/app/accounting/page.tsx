"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { canManageAccounting } from "@/lib/auth"
import { apiJson } from "@/lib/api"
import { toast } from "sonner"

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

type ReportKind = "trial" | "balance" | "income" | "cash"

export default function AccountingPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [reportKind, setReportKind] = useState<ReportKind>("trial")
  const [reportLoading, setReportLoading] = useState(false)
  const [trialReport, setTrialReport] = useState<Record<string, unknown> | null>(null)
  const [balanceReport, setBalanceReport] = useState<Record<string, unknown> | null>(null)
  const [incomeReport, setIncomeReport] = useState<Record<string, unknown> | null>(null)
  const [cashReport, setCashReport] = useState<Record<string, unknown> | null>(null)

  const fetchAccountingData = useCallback(async () => {
    try {
      const [a, j] = await Promise.all([
        apiJson<Account[]>("/api/accounting/Accounts"),
        apiJson<JournalEntry[]>("/api/accounting/JournalEntries"),
      ])
      setAccounts(a)
      setJournalEntries(j)
    } catch {
      toast.error("Could not load accounting data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!canManageAccounting()) {
      router.push("/")
      return
    }
    fetchAccountingData()
  }, [router, fetchAccountingData])

  const loadReport = useCallback(async (kind: ReportKind) => {
    setReportLoading(true)
    try {
      switch (kind) {
        case "trial":
          setTrialReport(await apiJson("/api/accounting/Reports/trial-balance"))
          break
        case "balance":
          setBalanceReport(await apiJson("/api/accounting/Reports/balance-sheet"))
          break
        case "income":
          setIncomeReport(await apiJson("/api/accounting/Reports/income-statement"))
          break
        case "cash":
          setCashReport(await apiJson("/api/accounting/Reports/cash-flow"))
          break
      }
    } catch {
      toast.error("Could not load report")
    } finally {
      setReportLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading) {
      loadReport(reportKind)
    }
  }, [reportKind, loading, loadReport])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalAssets = accounts.filter((a) => a.type === "Asset").reduce((sum, a) => sum + a.balance, 0)
  const totalLiabilities = accounts.filter((a) => a.type === "Liability").reduce((sum, a) => sum + a.balance, 0)
  const totalRevenue = accounts.filter((a) => a.type === "Revenue").reduce((sum, a) => sum + a.balance, 0)
  const totalExpenses = accounts.filter((a) => a.type === "Expense").reduce((sum, a) => sum + a.balance, 0)
  const netIncome = totalRevenue - totalExpenses

  const recentTransactions = journalEntries
    .slice(0, 10)
    .flatMap((entry) =>
      entry.lines.map((line) => ({
        id: `${entry.id}-${line.id}`,
        date: entry.date,
        description: entry.description,
        account: line.account?.name || "Unknown",
        debit: line.debit,
        credit: line.credit,
      }))
    )

  const trialAccounts = (trialReport?.accounts as Array<Record<string, unknown>>) || []
  const tbDebits = Number(trialReport?.totalDebits ?? 0)
  const tbCredits = Number(trialReport?.totalCredits ?? 0)

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
            <p className="text-xs text-muted-foreground">Account balances (revenue)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {netIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Revenue - Expenses (COA)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chart of Accounts</CardTitle>
              <CardDescription>All active accounts in your system</CardDescription>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No accounts found</div>
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
                          <Badge
                            variant={
                              account.type === "Asset"
                                ? "default"
                                : account.type === "Revenue"
                                  ? "default"
                                  : account.type === "Liability"
                                    ? "destructive"
                                    : account.type === "Expense"
                                      ? "outline"
                                      : "secondary"
                            }
                          >
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
                <div className="text-center py-8 text-muted-foreground">No transactions found</div>
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
          <Card>
            <CardHeader>
              <CardTitle>Financial reports</CardTitle>
              <CardDescription>Live data from the accounting service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={reportKind} onValueChange={(v) => setReportKind(v as ReportKind)}>
                <TabsList className="flex flex-wrap h-auto gap-1">
                  <TabsTrigger value="trial">Trial balance</TabsTrigger>
                  <TabsTrigger value="balance">Balance sheet</TabsTrigger>
                  <TabsTrigger value="income">Income statement</TabsTrigger>
                  <TabsTrigger value="cash">Cash flow</TabsTrigger>
                </TabsList>

                {reportLoading && (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                  </div>
                )}

                {!reportLoading && reportKind === "trial" && trialReport && (
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      As of {new Date(String(trialReport.asOfDate)).toLocaleDateString()} — Debits{" "}
                      <strong>LKR {tbDebits.toLocaleString()}</strong>, Credits{" "}
                      <strong>LKR {tbCredits.toLocaleString()}</strong>
                      {trialReport.isBalanced ? (
                        <Badge className="ml-2" variant="secondary">
                          Balanced
                        </Badge>
                      ) : (
                        <Badge className="ml-2" variant="destructive">
                          Variance
                        </Badge>
                      )}
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trialAccounts.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono">{String(row.accountCode)}</TableCell>
                            <TableCell>{String(row.name)}</TableCell>
                            <TableCell>{String(row.type)}</TableCell>
                            <TableCell className="text-right">
                              {Number(row.debit) > 0 ? `LKR ${Number(row.debit).toLocaleString()}` : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(row.credit) > 0 ? `LKR ${Number(row.credit).toLocaleString()}` : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {!reportLoading && reportKind === "balance" && balanceReport && (
                  <div className="grid gap-6 pt-4 md:grid-cols-3">
                    {["assets", "liabilities", "equity"].map((key) => {
                      const section = balanceReport[key] as {
                        accounts?: Array<{ accountCode: string; name: string; balance: number }>
                        total?: number
                        retainedEarnings?: number
                      }
                      const rows = section?.accounts || []
                      return (
                        <div key={key} className="space-y-2">
                          <h3 className="font-semibold capitalize">{key}</h3>
                          <Table>
                            <TableBody>
                              {rows.map((r) => (
                                <TableRow key={r.accountCode}>
                                  <TableCell className="text-xs">
                                    {r.accountCode} {r.name}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    LKR {Number(r.balance).toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                              {key === "equity" && section?.retainedEarnings !== undefined && (
                                <TableRow>
                                  <TableCell className="text-xs">Retained earnings</TableCell>
                                  <TableCell className="text-right">
                                    LKR {Number(section.retainedEarnings).toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              )}
                              <TableRow>
                                <TableCell className="font-bold">Total</TableCell>
                                <TableCell className="text-right font-bold">
                                  LKR {Number(section?.total ?? 0).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      )
                    })}
                  </div>
                )}

                {!reportLoading && reportKind === "income" && incomeReport && (
                  <div className="grid gap-6 pt-4 md:grid-cols-2">
                    {["revenue", "expenses"].map((key) => {
                      const block = incomeReport[key] as {
                        accounts?: Array<{ accountCode: string; name: string; amount: number }>
                        total?: number
                      }
                      const rows = block?.accounts || []
                      return (
                        <div key={key} className="space-y-2">
                          <h3 className="font-semibold capitalize">{key}</h3>
                          <Table>
                            <TableBody>
                              {rows.map((r) => (
                                <TableRow key={r.accountCode}>
                                  <TableCell className="text-xs">
                                    {r.accountCode} {r.name}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    LKR {Number(r.amount).toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell className="font-bold">Total</TableCell>
                                <TableCell className="text-right font-bold">
                                  LKR {Number(block?.total ?? 0).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      )
                    })}
                    <div className="md:col-span-2 rounded-md border p-4">
                      <p className="text-lg font-semibold">
                        Net income: LKR{" "}
                        {Number(incomeReport.netIncome ?? 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Period {new Date(String(incomeReport.startDate)).toLocaleDateString()} —{" "}
                        {new Date(String(incomeReport.endDate)).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {!reportLoading && reportKind === "cash" && cashReport && (
                  <div className="space-y-4 pt-4">
                    {"message" in cashReport && typeof cashReport.message === "string" ? (
                      <p className="text-muted-foreground">{cashReport.message}</p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-6 text-sm">
                          <span>
                            Cash in:{" "}
                            <strong>
                              LKR {Number(cashReport.totalCashIn ?? 0).toLocaleString()}
                            </strong>
                          </span>
                          <span>
                            Cash out:{" "}
                            <strong>
                              LKR {Number(cashReport.totalCashOut ?? 0).toLocaleString()}
                            </strong>
                          </span>
                          <span>
                            Net:{" "}
                            <strong>
                              LKR {Number(cashReport.netCashFlow ?? 0).toLocaleString()}
                            </strong>
                          </span>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Account</TableHead>
                              <TableHead className="text-right">In</TableHead>
                              <TableHead className="text-right">Out</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {((cashReport.transactions as Array<Record<string, unknown>>) || []).map(
                              (t, i) => (
                                <TableRow key={i}>
                                  <TableCell>
                                    {new Date(String(t.date)).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>{String(t.description)}</TableCell>
                                  <TableCell className="text-xs">
                                    {String(t.accountCode)} {String(t.accountName)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {Number(t.cashIn) > 0
                                      ? `LKR ${Number(t.cashIn).toLocaleString()}`
                                      : "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {Number(t.cashOut) > 0
                                      ? `LKR ${Number(t.cashOut).toLocaleString()}`
                                      : "—"}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </div>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
