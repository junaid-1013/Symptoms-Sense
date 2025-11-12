import { ReactNode } from 'react';

interface InfoSectionProps {
    title: string;
    children: ReactNode;
}

const InfoSection = ({ title, children }: InfoSectionProps) => {
    return (
        <div className="relative block overflow-hidden rounded-lg md:border-none border border-gray-100 p-4 sm:p-6 lg:p-8 
        md:col-span-3 col-span-5 shadow-lg md:shadow-none">
            <div className="flex gap-5">
                <div className="w-full">
                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                        {title}
                    </h3>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default InfoSection;