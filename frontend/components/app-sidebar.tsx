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
  ChevronRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
                {data.navMain.map((item) => (
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={data.user.avatar} alt={data.user.name} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{data.user.name}</span>
                    <span className="truncate text-xs">{data.user.email}</span>
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
                      <AvatarImage src={data.user.avatar} alt={data.user.name} />
                      <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{data.user.name}</span>
                      <span className="truncate text-xs">{data.user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <BadgeCheck className="mr-2 h-4 w-4" />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}