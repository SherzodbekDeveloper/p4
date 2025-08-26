"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Home, Package, Settings, Users, FileText, Menu, X, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Cookies from "js-cookie"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, current: true },
  { name: "Mahsulot qo'sh", href: "/product", icon: Package, current: false },
  { name: "Omborlar", href: "/storage", icon: Package, current: false },
  { name: "Buyurtmalar", href: "/orders", icon: FileText, current: false },
  { name: "Sozlamalar", href: "/settings", icon: Settings, current: false },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        const userRef = doc(db, "users", currentUser.uid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          setUserData(userSnap.data())
        }
      } else {
        setUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    const auth = getAuth()
    await signOut(auth)
    Cookies.remove("firebaseToken") // cookie token ham o‘chadi
    router.push("/auth") // Auth sahifasiga qaytaramiz
  }

  return (
    <div
      className={cn("bg-gray-200 text-white transition-all duration-300 ease-in-out", isCollapsed ? "w-16" : "w-64")}
    >
      <div className="flex h-full flex-col">
        {/* Logo & Collapse Button */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-300 p-2 ">
          {!isCollapsed && <img src="/logo.png" alt="Logo" width={100} height={100} />}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-black hover:text-white hover:bg-gray-800"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                  item.href === pathname
                    ? " bg-gray-800 text-white"
                    : " text-black/80 hover:bg-gray-800 hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    item.href === pathname ? "text-white" : "text-black group-hover:text-white",
                  )}
                />
                {!isCollapsed && item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                <Users className="h-4 w-4 text-gray-300" />
              </div>
              {!isCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-black">
                    {userData?.firstName ?? "Anonim"} {userData?.lastName ?? ""}
                  </p>
                  <p className="text-xs text-black">{user?.email}</p>
                </div>
              )}
            </div>

          </div>
          <Button
          className='w-full mt-4'
            
            onClick={handleLogout}
          >
            Hisobdan chiqish
          </Button>

        </div>
      </div>
    </div>
  )
}
