const members = [
    {
        id: 1,
        name: "Khubaib Mashood",
        title: "CFO",
        imageSrc:
            "https://images.unsplash.com/photo-1634926878768-2a5b3c42f139?fit=clamp&w=400&h=400&q=80",
    },
    {
        id: 2,
        name: "Asadullah Rind",
        title: "CEO",
        imageSrc:
            "https://images.unsplash.com/photo-1635003913011-95971abba560?fit=clamp&w=400&h=400&q=80",
    },
    {
        id: 3,
        name: "Muhammad Muzammil",
        title: "CTO",
        imageSrc:
            "https://images.unsplash.com/photo-1634193295627-1cdddf751ebf?fit=clamp&w=400&h=400&q=80",
    },
   
];


const OurTeam = () => {
    return (
        <>
            <div id="team" className="flex items-center justify-center min-h-screen bg-white pt-8">
                <div className="flex flex-col mt-8">
                    <div className="container max-w-7xl px-4">
                        <div className="flex flex-wrap justify-center text-center mb-24">
                            <div className="w-full lg:w-6/12 px-4">
                                <h2 className="text-center text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                                    Meet the Team
                                </h2>
                                <p className="text-gray-700 text-lg font-light">
                                    With over 100 years of combined experience, we&apos;ve got a well-seasoned team at the helm.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    className="w-full md:w-6/12 lg:w-3/12 mb-6 px-6 sm:px-6 lg:px-4"
                                >
                                    <div className="flex flex-col">
                                        <a href="#" className="mx-auto">
                                            <img
                                                className="rounded-2xl drop-shadow-md hover:drop-shadow-xl transition-all duration-200 delay-100"
                                                src={member.imageSrc}
                                            />
                                        </a>
                                        <div className="text-center mt-6">
                                            <h1 className="text-gray-900 text-xl font-bold mb-1">
                                                {member.name}
                                            </h1>
                                            <div className="text-gray-700 font-light mb-2">{member.title}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </>
    )
}

export default OurTeam