"use client"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table } from "@tanstack/react-table"
import { ChevronDownIcon } from "lucide-react"
import * as React from "react"

interface DataTableToolbarProps<TData> {
    table: Table<TData>
    actionButton?: React.ReactNode
}

export function DataTableToolbar<TData>({
    table,
    actionButton,
}: DataTableToolbarProps<TData>) {
    const [searchColumn, setSearchColumn] = React.useState<string>("")
    const [searchValue, setSearchValue] = React.useState("")

    // Get all columns that can be filtered
    const columns = table.getAllColumns().filter(
        (column) => column.getCanFilter() && column.id !== "actions"
    )

    // Handle search
    React.useEffect(() => {
        if (searchColumn && searchValue) {
            table.getColumn(searchColumn)?.setFilterValue(searchValue)
        } else {
            columns.forEach((column) => {
                column.setFilterValue("")
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchColumn, searchValue, table])

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                {/* Search Input with Column Selector Dropdown */}
                <div className="flex items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-r-none border-r-0"
                            >
                                {searchColumn
                                    ? (() => {
                                        const col = columns.find((col) => col.id === searchColumn);
                                        return col?.id
                                            ? col.id.charAt(0).toUpperCase() + col.id.slice(1).toLowerCase()
                                            : "Filter Column";
                                    })()
                                    : "Filter Column"}

                                <ChevronDownIcon className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {columns.map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    checked={searchColumn === column.id}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSearchColumn(column.id)
                                        } else {
                                            setSearchColumn("")
                                            setSearchValue("")
                                        }
                                    }}
                                >
                                    {column.id.charAt(0).toUpperCase() + column.id.slice(1).toLowerCase()}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Input
                        placeholder={searchColumn ? `Search by ${searchColumn}...` : "Select a column to search"}
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        className="h-8 w-[150px] rounded-l-none lg:w-[250px]"
                        disabled={!searchColumn}
                    />
                </div>
            </div>

            {/* Right side - Column visibility and Action Button */}
            <div className="flex items-center space-x-2">
                {/* Column Visibility Selector */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto">
                            Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Action Button passed as prop */}
                {actionButton}
            </div>
        </div>
    )
}