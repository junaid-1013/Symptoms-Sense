"use client"
import { useToast } from "@/components/ui/use-toast";
import { PostFeedbackApi } from "@/endPoints/feedback.endPoints";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
interface ChildProps {
    doctorData?: any;
}

const RatingForm: React.FC<ChildProps> = ({ doctorData }) => {
    const router = useRouter();
    const { toast } = useToast()
    const [modalOpen, setModalOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement | null>(null);
    const modal = useRef<HTMLDivElement | null>(null);
    const [rating, setRating] = useState(1);
    const [message, setMessage] = useState('');

    const handleStarClick = (newRating: number) => {
        setRating(newRating);
    };

    const onSubmit = async () => {
        try {
            if (doctorData) {
                // Doctor review — still handled by the legacy route until Module 5.
                const axios = (await import("axios")).default;
                await axios.post("/api/doctorReview", {
                    rat: rating,
                    mess: message,
                    doctor: doctorData.doctor,
                });
                router.push("/profile");
            } else {
                // Site-wide testimonial — now served by FastAPI.
                await PostFeedbackApi({ rating, message });
                router.push("/");
            }

            window.location.reload();
            toast({
                title: "Success!",
                description: "Thank you for sharing your feedback",
            });
            setMessage('');
        } catch (error: any) {
            const detail =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "An error occurred during feedback";
            toast({
                title: "Failed!",
                description: detail,
                variant: "destructive",
            });
        }
    };

    // close on click outside
    useEffect(() => {
        const clickHandler = ({ target }: MouseEvent) => {
            if (!modal.current) return;
            if (
                !modalOpen ||
                modal.current.contains(target as Node) ||
                trigger.current?.contains(target as Node)
            )
                return;
            setModalOpen(false);
        };
        document.addEventListener("click", clickHandler);
        return () => document.removeEventListener("click", clickHandler);
    });

    // close if the esc key is pressed
    useEffect(() => {
        const keyHandler = ({ keyCode }: KeyboardEvent) => {
            if (!modalOpen || keyCode !== 27) return;
            setModalOpen(false);
        };
        document.addEventListener("keydown", keyHandler);
        return () => document.removeEventListener("keydown", keyHandler);
    }, [modalOpen]);

    return (
        <>
            <div className="flex container mx-auto justify-center">
                <button
                    ref={trigger}
                    onClick={() => setModalOpen(true)}
                    className={`rounded-lg bg-[#192a56] px-6 py-3 text-base font-medium text-white flex gap-x-2 hover:bg-[#192a56]/90`}
                >
                    <div className="flex items-center flex-row-reverse group">
                        <Star className="w-5 h-5 ml-2 place-items-end group-hover:animate-ping absolute " />
                        <Star className="w-5 h-5 ml-2 place-items-end relative" />
                        <span className="place-items-end">Rate</span>
                    </div>
                </button>
                <div className={`z-30 fixed left-0 top-0 flex h-full min-h-screen w-full items-center justify-center 
                        bg-black/80 backdrop-blur-sm px-4 py-5 ${modalOpen ? "block" : "hidden"}`}>
                    <div
                        ref={modal}
                        onFocus={() => setModalOpen(true)}
                        className="w-full max-w-[570px] rounded-[20px] bg-white px-8 py-12 text-center md:px-[70px] md:py-[60px]">
                        <h3 className="pb-[18px] text-xl font-semibold text-black  sm:text-2xl">Rate your experience</h3>
                        <span className={`mx-auto mb-4 inline-block h-1 w-[90px] rounded bg-[#192a56]`}></span>
                        <div className="flex flex-col gap-y-4">
                            <div className="flex flex-row-reverse justify-center">
                                <Star
                                    className={`fill-gray-400 peer peer-hover:fill-yellow-400 hover:fill-yellow-400 
                                    text-transparent cursor-pointer ${rating <= 1 ? 'fill-yellow-400' : ''}`}
                                    onClick={() => handleStarClick(1)}
                                />
                                <Star
                                    className={`fill-gray-400 peer peer-hover:fill-yellow-400 hover:fill-yellow-400 
                                    text-transparent cursor-pointer ${rating <= 2 ? 'fill-yellow-400' : ''}`}
                                    onClick={() => handleStarClick(2)}
                                />
                                <Star
                                    className={`fill-gray-400 peer peer-hover:fill-yellow-400 hover:fill-yellow-400 
                                    text-transparent cursor-pointer ${rating <= 3 ? 'fill-yellow-400' : ''}`}
                                    onClick={() => handleStarClick(3)}
                                />
                                <Star
                                    className={`fill-gray-400 peer peer-hover:fill-yellow-400 hover:fill-yellow-400 
                                    text-transparent cursor-pointer ${rating <= 4 ? 'fill-yellow-400' : ''}`}
                                    onClick={() => handleStarClick(4)}
                                />
                                <Star
                                    className={`fill-gray-400 peer peer-hover:fill-yellow-400 hover:fill-yellow-400 
                                    text-transparent cursor-pointer ${rating <= 5 ? 'fill-yellow-400' : ''}`}
                                    onClick={() => handleStarClick(5)}
                                />
                            </div>
                            <textarea className="flex w-full p-4 text-gray-500 rounded-xl resize-none border"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Let us Know here"
                            ></textarea>
                            <button
                                onClick={onSubmit}
                                className="rounded-md border border-[#192a56] bg-[#192a56] p-3 text-center 
                                    text-base font-medium text-white transition hover:bg-[#192a56]/90 w-1/3 self-center"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RatingForm;