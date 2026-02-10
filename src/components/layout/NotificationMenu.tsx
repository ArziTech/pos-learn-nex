"use client"

import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

// Placeholder notifications - replace with real data
const notifications = [
  {
    id: 1,
    title: "New attendance record",
    message: "John Doe checked in at 08:00 AM",
    time: "5 min ago",
    unread: true,
  },
  {
    id: 2,
    title: "Leave request",
    message: "Jane Smith requested leave for tomorrow",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 3,
    title: "System update",
    message: "System will be maintained tonight",
    time: "2 hours ago",
    unread: false,
  },
]

export function NotificationMenu() {
  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative outline-none">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              >
                <div className="flex items-start justify-between w-full">
                  <p className="text-sm font-medium">{notification.title}</p>
                  {notification.unread && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {notification.time}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-center justify-center">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
