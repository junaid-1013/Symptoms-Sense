const members = [
    {
        id: 1,
        name: "Khubaib Mashood",
        title: "CFO",
        imageSrc:
            "/khubaib.jpg",
    },
    {
        id: 2,
        name: "Asadullah Rind",
        title: "CEO",
        imageSrc:
            "/asadullah.jpg",
    },
    {
        id: 3,
        name: "Muhammad Muzammil",
        title: "CTO",
        imageSrc:
            "/muzzi.jpg",
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
                                {/*
                                <p className="text-gray-700 text-lg font-light">
                                    With over 100 years of combined experience, we&apos;ve got a well-seasoned team at the helm.
                                </p>
    */}
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-14">
    {members.map((member) => (
        <div
            key={member.id}
            className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 mb-6 px-4"
        >
            <div className="flex flex-col items-center">
            <div className="relative w-60 h-50  " >
        <img
          className="object-cover w-full h-full rounded"
          src={member.imageSrc}
          alt={member.name}
        />
      </div>
                <div className="text-center mt-6">
                    <h1 className="text-gray-900 text-lg font-bold mb-1">
                        {member.name}
                    </h1>
                    <div className="text-gray-700 font-light">{member.title}</div>
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