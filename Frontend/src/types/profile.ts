export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  user_type?: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  avatar_url?: string | null;
  last_login?: string | Date | null;
}
export interface Appointment {
  time: string
  doctor: string
  doctor_id: string
  image: string
}
export interface CompletedAppointment {
  time: string
  doctor: string
  image: string
}
export interface Reminder {
  medicineName: string
  dosage: number
  selectedDays: string[]
  reminderTime: string
  medicineType: string
}
export interface ProfileStats {
  upcomingAppointments: number
  activeReminders: number
  completedAppointments: number
  completionRate: number
}
export interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}
export interface AppointmentCardProps {
  data: Appointment | CompletedAppointment
  type: "upcoming" | "completed"
  onCancel?: () => void
}
export interface ReminderCardProps {
  data: Reminder
  onCancel: () => void
}
export interface ProfileHeaderProps {
  stats: ProfileStats
}
export interface StatsGridProps {
  stats: ProfileStats
}
export interface TabsSectionProps {
  appointments: Appointment[]
  reminders: Reminder[]
  completedAppointments: CompletedAppointment[]
  onCancelAppointment: (data: Appointment) => void
  onCancelReminder: (data: Reminder) => void
}
export interface UserProfileFormData {
  name: string
}
export interface ProfileImageUploadProps {
  imagePreview: string | null
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}