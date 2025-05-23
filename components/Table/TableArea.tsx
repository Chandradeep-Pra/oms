import React, { useMemo, useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { columns } from "./columns";
import {
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "../pagination/Pagination";
import { OrderType } from "@/types/orderType";
import OrderDialog from "../OrderDialog";
import { useCurrency } from "@/hooks/useCurrency";

export interface PaginationType {
  pageIndex: number;
  pageSize: number;
}

interface TableAreaProps {
  allOrders: OrderType[];
}

const TableArea: React.FC<TableAreaProps> = ({ allOrders }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [pagination, setPagination] = useState<PaginationType>({ pageIndex: 0, pageSize: 8 });
  const [showInvoice, setShowInvoice] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const tabs = [
    { value: "all", label: "All Orders", count: allOrders.length },
    { value: "pending", label: "Pending", count: allOrders.filter(f => f.status.toLowerCase() === "pending").length },
    { value: "shipped", label: "Shipped", count: allOrders.filter(f => f.status.toLowerCase() === "shipped").length },
    { value: "delivered", label: "Delivered", count: allOrders.filter(f => f.status.toLowerCase() === "delivered").length },
    { value: "cancelled", label: "Cancelled", count: allOrders.filter(f => f.status.toLowerCase() === "cancelled").length },
  ];

  // Filter by tab, then by search term
  const filteredData = useMemo(() => {
    let data = activeTab === "all"
      ? allOrders
      : allOrders.filter(o => o.status.toLowerCase() === activeTab);
    const search = globalFilter.trim().toLowerCase();
    if (search) {
      data = data.filter(o => {
        const invoice = o.invoiceNumber || "";
        return (
          o.id.toLowerCase().includes(search) ||
          (o.customer?.name || "").toLowerCase().includes(search) ||
          invoice.toLowerCase().includes(search)
        );
      });
    }
    return data;
  }, [allOrders, activeTab, globalFilter]);

  const memoizedColumns = useMemo(
    () =>
      columns({
        editingRowId,
        setEditingRowId,
        showInvoice,
        toggleInvoiceVisibility: () => setShowInvoice(prev => !prev),
      }),
    [editingRowId, showInvoice]
  );

  const table = useReactTable({
    data: filteredData,
    columns: memoizedColumns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    const col = table.getColumn("orderOrInvoice");
    if (col) col.toggleVisibility(true);
  }, [showInvoice, table]);

  return (
    <Card className="md:m-6 shadow-none">
      <div className="md:p-8">
        {/* Search bar */}
        <div className="mb-4 flex justify-end">
          <Input
            placeholder="Search by order ID, customer, or invoice"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Tabs and Add Order button */}
        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value)}
          className="mb-6 w-full"
        >
          <div className="flex items-center justify-between mb-4 mt-2">
            <TabsList className="h-10 rounded-2xl md:rounded-xl">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`flex items-center gap-2 h-8 rounded-xl transition-all $
                    activeTab === tab.value ? "bg-light-primary text-white" : "text-gray-600"
                  }`}
                >
                  <span className="text-xs">{tab.label}</span>
                  <span className="text-xs hidden md:inline-block">{tab.count}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <OrderDialog />
          </div>

          {tabs.map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="w-full mt-9">
              <div className="md:rounded-md rounded-none md:border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map(row => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <Pagination table={table} pagination={pagination} setPagination={setPagination} />
    </Card>
  );
};

export default TableArea;
