"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  Command,
  ChevronsUpDown,
  LogOut,
  Sparkles,
  BadgeCheck,
  CreditCard,
  Bell,
  DollarSign,
  ChevronRight,
  Shield,
  Calendar,
  Clock,
  FileText,
  Award
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getUser, isAdmin, clearAuthData } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


const data = {
  user: {
    name: "Admin User",
    email: "admin@nexcore.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "NexCore ERP",
      logo: Command,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "HR Module",
      url: "/hr",
      icon: Users,
      items: [
        { title: "Employees", url: "/hr/employees" },
        { title: "Attendance", url: "/hr/attendance" },
        { title: "Leave Management", url: "/hr/leave" },
        { title: "Performance Reviews", url: "/hr/reviews" },
        { title: "Payroll", url: "/hr/payroll" },
      ],
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: Package,
      items: [
        { title: "Products", url: "/inventory/products" },
      ],
    },
    {
      title: "Sales",
      url: "/sales",
      icon: DollarSign,
      items: [
        { title: "Customers", url: "/sales/customers" },
        { title: "Sales Orders", url: "/sales/orders" },
      ],
    },
    {
      title: "Procurement",
      url: "/procurement",
      icon: ShoppingCart,
      items: [
        { title: "Suppliers", url: "/procurement/suppliers" },
        { title: "Purchase Orders", url: "/procurement/orders" },
      ],
    },
    {
      title: "Accounting",
      url: "/accounting",
      icon: Receipt,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null)
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false)

  React.useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)
  }, [])

  const handleLogout = () => {
    clearAuthData()
    toast.success("Logged out successfully")
    router.push("/auth/login")
  }

  // Filter navigation items based on user role
  const navItems = React.useMemo(() => {
    const currentUser = getUser()
    if (!currentUser) return []

    const role = currentUser.role
    const items: any[] = []

    // Dashboard for everyone
    items.push({
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
    })

    // Admin sees everything including administration
    if (role === "Admin") {
      items.push({
        title: "Administration",
        url: "/admin",
        icon: Shield,
        isActive: false,
        items: [
          { title: "Dashboard", url: "/admin" },
          { title: "User Management", url: "/admin/users" },
        ],
      })
      items.push({
        title: "HR Module",
        url: "/hr",
        icon: Users,
        items: [
          { title: "Employees", url: "/hr/employees" },
          { title: "Attendance", url: "/hr/attendance" },
          { title: "Leave Management", url: "/hr/leave" },
          { title: "Performance Reviews", url: "/hr/reviews" },
          { title: "Payroll", url: "/hr/payroll" },
        ],
      })
      items.push({
        title: "Inventory",
        url: "/inventory",
        icon: Package,
        items: [
          { title: "Products", url: "/inventory/products" },
        ],
      })
      items.push({
        title: "Sales",
        url: "/sales",
        icon: DollarSign,
        items: [
          { title: "Customers", url: "/sales/customers" },
          { title: "Sales Orders", url: "/sales/orders" },
        ],
      })
      items.push({
        title: "Procurement",
        url: "/procurement",
        icon: ShoppingCart,
        items: [
          { title: "Suppliers", url: "/procurement/suppliers" },
          { title: "Purchase Orders", url: "/procurement/orders" },
        ],
      })
      items.push({
        title: "Accounting",
        url: "/accounting",
        icon: Receipt,
      })
    }
    // HR Manager sees only HR module
    else if (role === "HRManager") {
      items.push({
        title: "HR Module",
        url: "/hr",
        icon: Users,
        items: [
          { title: "Employees", url: "/hr/employees" },
          { title: "Attendance", url: "/hr/attendance" },
          { title: "Leave Management", url: "/hr/leave" },
          { title: "Performance Reviews", url: "/hr/reviews" },
          { title: "Payroll", url: "/hr/payroll" },
        ],
      })
    }
    // Accountant sees only Accounting module
    else if (role === "Accountant") {
      items.push({
        title: "Accounting",
        url: "/accounting",
        icon: Receipt,
      })
    }
    // Sales/Procurement sees Sales, Procurement, and Inventory
    else if (role === "SalesProcurement") {
      items.push({
        title: "Inventory",
        url: "/inventory",
        icon: Package,
        items: [
          { title: "Products", url: "/inventory/products" },
        ],
      })
      items.push({
        title: "Sales",
        url: "/sales",
        icon: DollarSign,
        items: [
          { title: "Customers", url: "/sales/customers" },
          { title: "Sales Orders", url: "/sales/orders" },
        ],
      })
      items.push({
        title: "Procurement",
        url: "/procurement",
        icon: ShoppingCart,
        items: [
          { title: "Suppliers", url: "/procurement/suppliers" },
          { title: "Purchase Orders", url: "/procurement/orders" },
        ],
      })
    }
    // Employee sees only self-service features
    else if (role === "Employee") {
      items.push({
        title: "My Attendance",
        url: "/hr/attendance",
        icon: Clock,
        isActive: false,
      })
      items.push({
        title: "My Leave",
        url: "/hr/leave",
        icon: Calendar,
        isActive: false,
      })
      items.push({
        title: "My Reviews",
        url: "/hr/reviews",
        icon: Award,
        isActive: false,
      })
      items.push({
        title: "My Payroll",
        url: "/hr/payroll",
        icon: FileText,
        isActive: false,
      })
    }

    return items
  }, [user])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <img src="/assets/logo.png" alt="NexCore ERP" className="h-10 w-10" />
          <span className="font-semibold text-base truncate">NexCore ERP</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {navItems.map((item) => (
                    item.items?.length ? (
                        <Collapsible 
                            key={item.title} 
                            asChild 
                            defaultOpen={item.isActive || pathname?.startsWith(item.url)} 
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip={item.title} className="transition-all duration-200 hover:bg-sidebar-accent hover:pl-3">
                                        {item.icon && <item.icon className="transition-transform duration-200 group-hover/collapsible:scale-110" />}
                                        <span className="font-medium">{item.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub className="overflow-hidden">
                                        <AnimatePresence>
                                          {item.items.map((subItem, index) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                              <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ delay: index * 0.05, duration: 0.2, ease: "easeOut" }}
                                              >
                                                <SidebarMenuSubButton asChild isActive={pathname === subItem.url} className="transition-all duration-200 hover:translate-x-1 hover:bg-sidebar-accent/50">
                                                  <Link href={subItem.url}>
                                                    <span>{subItem.title}</span>
                                                  </Link>
                                                </SidebarMenuSubButton>
                                              </motion.div>
                                            </SidebarMenuSubItem>
                                          ))}
                                        </AnimatePresence>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    ) : (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url} className="transition-all duration-200 hover:bg-sidebar-accent hover:pl-3">
                                <Link href={item.url}>
                                    {item.icon && <item.icon className="transition-transform duration-200 group-hover:scale-110" />}
                                    <span className="font-medium">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                ))}
            </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {user?.role === "Employee" ? (
              // Simple logout button for employees with confirmation dialog
              <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-semibold">Logout</span>
                  </SidebarMenuButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to logout? You will need to sign in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              // Dropdown menu for admin/managers
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.avatar} alt={user?.username} />
                      <AvatarFallback className="rounded-lg">
                        {user?.username?.substring(0, 2).toUpperCase() || "AD"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.username || "Admin"}</span>
                      <span className="truncate text-xs">{user?.email || "admin@nexcore.lk"}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user?.avatar} alt={user?.username} />
                        <AvatarFallback className="rounded-lg">
                          {user?.username?.substring(0, 2).toUpperCase() || "AD"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.username || "Admin"}</span>
                        <span className="truncate text-xs">{user?.email || "admin@nexcore.lk"}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <BadgeCheck className="mr-2 h-4 w-4" />
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}