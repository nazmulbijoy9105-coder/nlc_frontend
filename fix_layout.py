import re
with open("app/dashboard/layout.tsx","r",encoding="utf-8") as f: c=f.read()
# Fix 1: Replace direct getUser with useState pattern
old_block = """export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = getUser()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/")
    }
  }, [router])

  if (typeof window !== "undefined" && !isAuthenticated()) {
    return null
  }"""
print("Found old block:" , old_block in c)
