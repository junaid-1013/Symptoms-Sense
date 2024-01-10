import Image from "next/image";

type BRAND = {
    logo: string;
    name: string;
    visitors: number;
    revenues: string;
    sales: number;
    conversion: number;
};

const brandData: BRAND[] = [
    {
        logo: "/images/brand/brand-01.svg",
        name: "Google",
        visitors: 3.5,
        revenues: "5,768",
        sales: 590,
        conversion: 4.8,
    },
    {
        logo: "/images/brand/brand-02.svg",
        name: "Twitter",
        visitors: 2.2,
        revenues: "4,635",
        sales: 467,
        conversion: 4.3,
    },
    {
        logo: "/images/brand/brand-03.svg",
        name: "Github",
        visitors: 2.1,
        revenues: "4,290",
        sales: 420,
        conversion: 3.7,
    },
    {
        logo: "/images/brand/brand-04.svg",
        name: "Vimeo",
        visitors: 1.5,
        revenues: "3,580",
        sales: 389,
        conversion: 2.5,
    },
    {
        logo: "/images/brand/brand-05.svg",
        name: "Facebook",
        visitors: 3.5,
        revenues: "6,768",
        sales: 390,
        conversion: 4.2,
    },
];

const TableOne = () => {
    return (
        <div className="rounded-sm border border-[#E2E8F0] bg-white px-5 pt-6 pb-2 shadow-[0_8px_13px_-3px_rgba(0,0,0,0.07)] sm:px-7 xl:pb-1">
            <h4 className="mb-6 text-xl font-semibold text-black">
                Doctors
            </h4>

            <div className="flex flex-col">
                <div className="grid grid-cols-3 rounded-sm bg-gray-2 sm:grid-cols-5">
                    <div className="p-2 xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">
                            Source
                        </h5>
                    </div>
                    <div className="p-2 text-center xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">
                            Visitors
                        </h5>
                    </div>
                    <div className="p-2.5 text-center xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">
                            Revenues
                        </h5>
                    </div>
                    <div className="hidden p-2 text-center sm:block xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">
                            Sales
                        </h5>
                    </div>
                    <div className="hidden p-2 text-center sm:block xl:p-5">
                        <h5 className="text-sm font-medium uppercase xsm:text-base">
                            Conversion
                        </h5>
                    </div>
                </div>

                {brandData.map((brand, key) => (
                    <div
                        className={`grid grid-cols-3 sm:grid-cols-5 ${key === brandData.length - 1
                                ? ""
                                : "border-b border-[#E2E8F0] "
                            }`}
                        key={key}
                    >
                        <div className="flex items-center gap-3 p-2 xl:p-5">
                            <div className="flex-shrink-0">
                                <Image src={brand.logo} alt="Brand" width={48} height={48} />
                            </div>
                            <p className="hidden text-black sm:block">
                                {brand.name}
                            </p>
                        </div>

                        <div className="flex items-center justify-center p-2 xl:p-5">
                            <p className="text-black">{brand.visitors}K</p>
                        </div>

                        <div className="flex items-center justify-center p-2 xl:p-5">
                            <p className="text-[#10B981]">${brand.revenues}</p>
                        </div>

                        <div className="hidden items-center justify-center p-2 sm:flex xl:p-5">
                            <p className="text-black">{brand.sales}</p>
                        </div>

                        <div className="hidden items-center justify-center p-2 sm:flex xl:p-5">
                            <p className="text-[#259AE6]">{brand.conversion}%</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableOne;
