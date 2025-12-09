export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
            Total Revenue
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
            Active Employees
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
            Low Stock Alerts
        </div>
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
        Recent Activities Chart (Coming Soon)
      </div>
    </div>
  )
}