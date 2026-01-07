"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, ShoppingCart, Package, TrendingDown } from "lucide-react"
import { useRouter } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"

interface Supplier {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  sku: string
}

interface PurchaseOrder {
  id: number
  supplierId: number
  orderDate: string
  totalAmount: number
  status: string
}

export default function ProcurementOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    supplierId: 0,
    productSku: "",
    quantity: 1,
    orderDate: new Date().toISOString().split('T')[0],
    totalAmount: 0
  })

  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    if (userRole !== "Admin" && userRole !== "SalesProcurement") {
      router.push("/")
      return
    }
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/procurement/orders`),
        fetch(`${API_BASE_URL}/api/procurement/suppliers`),
        fetch(`${API_BASE_URL}/api/inventory/products`)
      ])
      const ordersData = await ordersRes.json()
      const suppliersData = await suppliersRes.json()
      const productsData = await productsRes.json()
      
      setOrders(ordersData)
      setSuppliers(suppliersData)
      setProducts(productsData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE_URL}/api/procurement/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: formData.supplierId,
          productSku: formData.productSku,
          quantity: formData.quantity,
          totalAmount: formData.totalAmount
        })
      })

      if (response.ok) {
        setIsDialogOpen(false)
        resetForm()
        fetchData()
      }
    } catch (error) {
      console.error("Error creating order:", error)
    }
  }

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/procurement/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrderId) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/procurement/orders/${selectedOrderId}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (response.ok) {
        setIsReceiveDialogOpen(false)
        setSelectedOrderId(null)
        fetchData()
      }
    } catch (error) {
      console.error("Error receiving goods:", error)
    }
  }

  const openReceiveDialog = (orderId: number) => {
    setSelectedOrderId(orderId)
    setIsReceiveDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      supplierId: 0,
      productSku: "",
      quantity: 1,
      orderDate: new Date().toISOString().split('T')[0],
      totalAmount: 0
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const filteredOrders = orders.filter(order =>
    order.id.toString().includes(searchQuery)
  )

  const totalSpend = orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const pendingOrders = orders.filter(o => o.status === "Draft" || o.status === "Submitted").length

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Received": return "default"
      case "Submitted": return "secondary"
      case "Draft": return "outline"
      default: return "outline"
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage procurement and purchase orders</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">LKR {totalSpend.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>View and manage all purchase orders</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Supplier ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono">PO-{order.id}</TableCell>
                  <TableCell>Supplier #{order.supplierId}</TableCell>
                  <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-medium">
                    LKR {order.totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleUpdateStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Submitted">Submitted</SelectItem>
                          <SelectItem value="Received">Received</SelectItem>
                        </SelectContent>
                      </Select>
                      {order.status === "Submitted" && (
                        <Button size="sm" onClick={() => openReceiveDialog(order.id)}>
                          Receive Goods
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Purchase Order</DialogTitle>
            <DialogDescription>Enter purchase order details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select
                    value={formData.supplierId.toString()}
                    onValueChange={(value) => setFormData({ ...formData, supplierId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select
                    value={formData.productSku}
                    onValueChange={(value) => setFormData({ ...formData, productSku: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.sku}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Order</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receive Goods</DialogTitle>
            <DialogDescription>
              Confirm that the goods for this purchase order have been received. This will update the order status and trigger inventory updates.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReceiveGoods}>
            <div className="grid gap-4 py-4">
              <p className="text-sm text-muted-foreground">
                Order ID: <span className="font-mono font-semibold">PO-{selectedOrderId}</span>
              </p>
              <p className="text-sm">
                This will mark the order as received and automatically update the inventory stock levels.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Confirm Receipt</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
