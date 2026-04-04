"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { canManageAccounting } from "@/lib/auth"
import { apiJson } from "@/lib/api"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"

interface Account {
  id: number
  accountCode: string
  name: string
  type: string
}

interface LineForm {
  accountId: string
  debit: string
  credit: string
}

export default function JournalEntryPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [description, setDescription] = useState("")
  const [referenceId, setReferenceId] = useState("")
  const [lines, setLines] = useState<LineForm[]>([
    { accountId: "", debit: "", credit: "" },
    { accountId: "", debit: "", credit: "" },
  ])

  useEffect(() => {
    if (!canManageAccounting()) {
      router.replace("/")
      return
    }
    ;(async () => {
      try {
        const data = await apiJson<Account[]>("/api/accounting/Accounts")
        setAccounts(data)
      } catch {
        toast.error("Could not load accounts")
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const addLine = () =>
    setLines((prev) => [...prev, { accountId: "", debit: "", credit: "" }])

  const removeLine = (index: number) => {
    if (lines.length <= 2) return
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  const updateLine = (index: number, patch: Partial<LineForm>) => {
    setLines((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    )
  }

  const totalDebit = lines.reduce(
    (s, l) => s + (parseFloat(l.debit) || 0),
    0
  )
  const totalCredit = lines.reduce(
    (s, l) => s + (parseFloat(l.credit) || 0),
    0
  )
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      toast.error("Description is required")
      return
    }
    if (!balanced) {
      toast.error("Debits must equal credits")
      return
    }

    const payloadLines = lines
      .map((l) => ({
        accountId: parseInt(l.accountId, 10),
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
      }))
      .filter(
        (l) =>
          l.accountId > 0 && ((l.debit > 0 && l.credit === 0) || (l.credit > 0 && l.debit === 0))
      )

    if (payloadLines.length < 2) {
      toast.error("Add at least two valid lines (one debit, one credit)")
      return
    }

    setSubmitting(true)
    try {
      await apiJson<unknown>("/api/accounting/JournalEntries", {
        method: "POST",
        body: JSON.stringify({
          date: new Date(date).toISOString(),
          description: description.trim(),
          referenceId: referenceId.trim() || `JE-${Date.now()}`,
          lines: payloadLines,
        }),
      })
      toast.success("Journal entry posted")
      router.push("/accounting")
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to post journal entry"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/accounting">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New journal entry</h1>
          <p className="text-muted-foreground">Double-entry lines must balance</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Header</CardTitle>
            <CardDescription>Date and narrative</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="je-date">Date</Label>
              <Input
                id="je-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="je-desc">Description</Label>
              <Input
                id="je-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Month-end accrual"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="je-ref">Reference (optional)</Label>
              <Input
                id="je-ref"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="External document #"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lines</CardTitle>
              <CardDescription>Select account; debit or credit (not both)</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="mr-2 h-4 w-4" />
              Add line
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {lines.map((line, index) => (
              <div
                key={index}
                className="grid gap-3 md:grid-cols-[1fr_120px_120px_auto] items-end"
              >
                <div className="space-y-2">
                  <Label className={index === 0 ? "" : "sr-only"}>Account</Label>
                  <Select
                    value={line.accountId}
                    onValueChange={(v) => updateLine(index, { accountId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.accountCode} — {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={index === 0 ? "" : "sr-only"}>Debit</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={line.debit}
                    onChange={(e) =>
                      updateLine(index, { debit: e.target.value, credit: "" })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className={index === 0 ? "" : "sr-only"}>Credit</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={line.credit}
                    onChange={(e) =>
                      updateLine(index, { credit: e.target.value, debit: "" })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(index)}
                  disabled={lines.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm">
              <div className="flex gap-6">
                <span>
                  Total debits:{" "}
                  <strong>LKR {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </span>
                <span>
                  Total credits:{" "}
                  <strong>LKR {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </span>
              </div>
              <span className={balanced ? "text-green-600" : "text-destructive"}>
                {balanced ? "Balanced" : "Out of balance"}
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/accounting">Cancel</Link>
              </Button>
              <Button type="submit" disabled={submitting || !balanced}>
                {submitting ? "Posting…" : "Post entry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
