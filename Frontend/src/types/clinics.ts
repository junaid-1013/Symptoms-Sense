export interface RegisterClinicApiProps {
    address: string,
    registration_no: string,
    established_year: number,
    token: string
}
export interface ClinicDoctorRegisterApiProps {
    email: string;
    name: string;
    phone: string;
    password: string;
    token: string;
}
export interface AddDoctorFormData {
    email: string;
    name: string;
    phone: string;
    password: string;
}
export interface ClinicDoctorDeleteApiProps {
    doctorId: string;
    token: string;
}