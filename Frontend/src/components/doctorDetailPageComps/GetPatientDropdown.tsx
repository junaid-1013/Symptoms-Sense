"use client";

import { useEffect, useState } from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { GetAllPatientsApi } from "@/endPoints/public.endPoints";

interface Patient {
    id: string;
    user_id: string;
    name: string; 
    email: string;
}

interface GetPatientDropdownProps {
    value: string | null;
    onChange: (id: string) => void;
}

const GetPatientDropdown = ({ value, onChange }: GetPatientDropdownProps) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        GetAllPatientsApi()
            .then((res) => {
                setPatients(res.data.data.patients || []);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <Select
            value={value ?? ""}
            onValueChange={(val) => onChange(val)}
            disabled={loading}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? "Loading patients..." : "Select patient"} />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
                {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                        {`${patient.name} (${patient.email})`}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default GetPatientDropdown;
