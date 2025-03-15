import { StatsCards } from "./components/StatsCards"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  return <StatsCards />
} 