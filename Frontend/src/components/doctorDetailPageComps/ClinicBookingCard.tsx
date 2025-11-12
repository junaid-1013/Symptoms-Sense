import { DoctorData } from '@/types';
import { Clock4 } from "lucide-react";
import { FaHospitalAlt } from "react-icons/fa";
import { MdOutlineLocationOn } from "react-icons/md";

const ClinicBookingCard = (props: { doctor: DoctorData }) => {
    const { doctor } = props;
    return (
        <div className="overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-lg">
            <div className="flex flex-col gap-y-8">
                <div className="flex w-full items-center justify-between">
                    <div className="w-[60%] flex items-center gap-x-4">
                        <FaHospitalAlt className="text-[#ff9e15] w-6 h-6" />
                        <h3 className="text-lg font-bold text-gray-900 sm:text-xl w-full">
                            {doctor.clinic_name}
                        </h3>
                    </div>
                    <span className="box w-[30%] p-2 text-[10px] font-semibold text-[#232426] text-center rounded bg-[#000066]/10">
                        Pay Online & Get Rs. 400 OFF
                    </span>
                </div>

                <div className="flex justify-between">
                    <p className="text-sm">Fee:</p>
                    <p className="text-sm font-semibold">Rs. 2500</p>
                </div>
                <hr className="-mt-6" />

                <div className="flex justify-between">
                    <p className="text-sm">Address:</p>
                    <p className="text-sm font-semibold flex gap-x-2 items-center">
                        <MdOutlineLocationOn className="w-5 h-5" />
                        <span>{doctor.clinic_address}</span>
                    </p>
                </div>
                <hr className="-mt-6" />

                <div className="flex justify-between">
                    <p className="flex gap-x-2 text-sm text-[#2a872e] font-semibold">
                        <Clock4 className="w-5 h-5" />Available today
                    </p>
                    <p className="text-sm font-semibold">10:00 PM - 11:00 PM</p>
                </div>

                <button className="py-4 bg-[#ff9e15] text-white justify-center rounded hover:bg-[#ff9e15]/90 font-semibold">
                    Book Appointment
                </button>
            </div>
        </div>
    );
};
export default ClinicBookingCard;