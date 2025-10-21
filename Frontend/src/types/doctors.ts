export interface DocSchema {
    id: string,
    name: string,
    img: string,
    specialization: string[],
    education: string[],
    experience: (string | number)[],
    services: string[]
    about: string
    experienceYears: number,
    city: string,
    streetAddress: string
    reservations: (string | any)[]
    feedbacks: (string | any)[]
}
export interface DoctorRegistrationFormValues {
    img: any;
    name: string;
    email: string;
    phone: string;
    image: FileList;
    services: string[];
    education: string[];
    specialization: string[];
    experienceYears: number;
    experienceDetails: string[];
    about: string;
    city: string;
    streetAddress: string;
}