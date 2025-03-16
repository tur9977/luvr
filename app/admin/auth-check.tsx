import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function AdminAuthCheck() {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (!session || sessionError) {
      console.error("Session error:", sessionError)
      redirect("/auth")
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      redirect("/auth")
    }

    if (!profile || profile.role !== "admin") {
      console.error("Not an admin:", profile)
      redirect("/")
    }

    return null
  } catch (error) {
    console.error("Auth check error:", error)
    redirect("/auth")
  }
} 