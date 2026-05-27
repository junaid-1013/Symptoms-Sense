export const RegisterDoctorUrl = "onboarding/doctor";
export const GetDoctorDetailUrl = "doctors";
export const DoctorReviewsUrl = (doctorId: string) => `doctors/${doctorId}/reviews`;
export const GetDoctorWeeklyScheduleUrl = "schedules/weekly/me";
export const BulkUpdateDoctorScheduleUrl = "schedules/weekly/bulk";
export const BlockDoctorSlotUrl = "schedules/blocked-slots";
export const CompleteAppointmentUrl = "prescriptions/complete-appointment";