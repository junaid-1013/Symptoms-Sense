export interface Appointment {
  id: string;
  patient: {
    id: string;
    name: string;
    email: string;
    age?: number | null;
    gender?: string | null;
  };
  doctor: {
    id: string;
    name: string;
    specializations: string[];
    profile_image?: string | null;
  };
  clinic: {
    id: string;
    name: string;
    address: string;
  };
  timeslot: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
  };
  status: string;
  appointment_type: string;
  chief_complaint: string | null;
  created_at: string;
  updated_at: string;
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
  data: Appointment;
  type: "upcoming" | "completed";
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
  completedAppointments: Appointment[]
  onCancelReminder: (data: Reminder) => void
}
export interface UserProfileFormData {
  name: string
}
export interface ProfileImageUploadProps {
  imagePreview: string | null
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}