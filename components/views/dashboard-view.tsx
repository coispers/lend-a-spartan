import Dashboard from "@/components/dashboard"
import type {
  ActivityEntry,
  CurrentUserState,
  DashboardMetricSummary,
  DashboardRole,
  UserMode,
} from "@/types/interfaces"

interface DashboardViewProps {
  currentUser: CurrentUserState | null
  metricsByRole: Record<DashboardRole, DashboardMetricSummary>
  recentActivity: ActivityEntry[]
  onNavigate: (mode: UserMode) => void
}

export function DashboardView({ currentUser, metricsByRole, recentActivity, onNavigate }: DashboardViewProps) {
  return (
    <Dashboard
      currentUser={currentUser}
      metricsByRole={metricsByRole}
      recentActivity={recentActivity}
      onNavigate={onNavigate}
    />
  )
}
