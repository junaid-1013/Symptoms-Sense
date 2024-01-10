import TableOne from "@/components/tables/TableOne"
import TableTwo from "@/components/tables/TableTwo"
import TableThree from "@/components/tables/TableThree"

export default function AdminDashboard() {

    return (
        <div className="flex flex-col gap-10 max-w-screen-xl px-4 py-8 mx-auto sm:px-6 sm:py-12 lg:px-8">
            <TableOne />
            <TableTwo />
            <TableThree />
        </div>
    )
}