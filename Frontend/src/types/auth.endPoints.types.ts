export interface LoginApiProps {
  email: string;
  password: string;
}
export interface RegisterApiProps {
  email: string;
  password: string;
  name: string;
  phone: string;
}
export interface GoogleAuthApiProps {
  code: string;
}