export interface RegisterClinicApiProps {
    address: string,
    registration_no: string,
    established_year: number
}
export interface ClinicDoctorRegisterApiProps {
    email: string;
    name: string;
    phone: string;
    password: string;
}
export interface AddDoctorFormData {
    email: string;
    name: string;
    phone: string;
    password: string;
}
export interface ClinicDoctorDeleteApiProps {
    doctorId: string;
}

export interface AddMedicineApiProps {
    name: string,
    description: string,
    manufacturer: string,
    category: string
}
export interface DeleteMedicineApiProps {
    medicineId: string
}

export interface UpdateMedicineApiProps {
    medicineId: string,
    name: string,
    description: string,
    manufacturer: string,
    category: string
}

export interface UpdateMedicineFormData {
  id: string
  name: string
  description: string
  manufacturer: string
  category: string
}