"use client";

import {
  useState,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
  memo,
} from "react";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from "lucide-react";
import { useDebounce } from "use-debounce";
import { FetchResult } from "@/types/pagination";

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  colSpan?: number;
  className?: string;
}

// Memoized search controls to prevent re-render when parent re-renders
interface SearchControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  pageSize: number;
  onPageSizeChange: (value: string) => void;
  searchPlaceholder: string;
  isLoading: boolean;
  isFetching: boolean;
  pageSizeOptions: number[];
}

const SearchControls = memo(
  ({
    searchQuery,
    onSearchChange,
    pageSize,
    onPageSizeChange,
    searchPlaceholder,
    isLoading,
    isFetching,
    pageSizeOptions,
  }: SearchControlsProps) => {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 w-full sm:max-w-sm">
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 ${
                isFetching ? "animate-pulse" : ""
              }`}
            />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
            {isFetching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 border-2 border-border border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <span className="text-sm text-muted-foreground">Tampilkan</span>
          <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">data</span>
        </div>
      </div>
    );
  }
);

SearchControls.displayName = "SearchControls";

export interface DataTableProps<T> {
  fetchAction: (params: {
    page: number;
    pageSize: number;
    search: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => Promise<FetchResult<T>>;
  columns: Column[] | Column[][];
  rows: (row: T[]) => React.ReactNode;
  queryKey: string;
  searchPlaceholder?: string;
  defaultSortBy?: string;
  defaultSortOrder?: "asc" | "desc";
  pageSizeOptions?: number[];
}

export interface DataTableRef {
  invalidate: () => void;
}

function DataTableComponent<T extends Record<string, any>>(
  {
    fetchAction,
    columns,
    rows,
    queryKey,
    searchPlaceholder = "Cari...",
    defaultSortBy = "createdAt",
    defaultSortOrder = "desc",
    pageSizeOptions = [10, 25, 50],
  }: DataTableProps<T>,
  ref: React.Ref<DataTableRef>
) {
  const queryClient = useQueryClient();

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

  // Debounce search query
  const [debouncedSearch] = useDebounce(searchQuery, 500);

  // Fetch data with React Query
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [
      queryKey,
      currentPage,
      pageSize,
      debouncedSearch,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const result = await fetchAction({
        page: currentPage,
        pageSize,
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });
      return result;
    },
    placeholderData: keepPreviousData,
  });

  // Expose invalidate method to parent
  useImperativeHandle(ref, () => ({
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  }));

  // Extract data and pagination
  const tableData = useMemo(
    () => (data?.success ? (data.data as T[]) : []),
    [data]
  );
  const pagination = useMemo(
    () => (data?.success ? data.pagination : undefined),
    [data]
  );
  const headers = useMemo(() => {
    const headerData = Array.isArray(columns[0])
      ? (columns as Column[][])
      : ([columns] as Column[][]);
    return headerData;
  }, [columns]);

  // Calculate total column span from the last header row
  const totalColSpan = useMemo(() => {
    if (headers.length === 0) return 0;
    const lastHeaderRow = headers[headers.length - 1];
    return lastHeaderRow.reduce((sum, col) => sum + (col.colSpan || 1), 0);
  }, [headers]);

  const totalRows = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 0;

  // Handlers with useCallback for stability
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handlePageSizeChange = useCallback((value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1); // Reset to first page
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const handleSortChange = useCallback(
    (key: string) => {
      if (sortBy === key) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      } else {
        setSortBy(key);
        setSortOrder("asc");
      }
    },
    [sortBy, sortOrder]
  );

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // Reduced for better mobile experience

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage <= 2) {
        for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
          pages.push(i);
        }
        pages.push("ellipsis-end");
      } else if (currentPage >= totalPages - 1) {
        pages.push("ellipsis-start");
        for (let i = Math.max(2, totalPages - 2); i <= totalPages - 1; i++) {
          pages.push(i);
        }
      } else {
        pages.push("ellipsis-start");
        pages.push(currentPage);
        pages.push("ellipsis-end");
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();
  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, totalRows);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search and Page Size Controls */}
      <SearchControls
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        searchPlaceholder={searchPlaceholder}
        isLoading={isLoading}
        isFetching={isFetching}
        pageSizeOptions={pageSizeOptions}
      />

      {/* Table */}
      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            {headers.map((headerGroup, groupIndex) => (
              <TableRow key={groupIndex}>
                {headerGroup.map((column) => (
                  <TableHead
                    key={column.key}
                    colSpan={column.colSpan}
                    className={column.className}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSortChange(column.key)}
                        className="flex items-center gap-2 hover:text-foreground font-medium disabled:opacity-50"
                        disabled={isLoading || isFetching}
                      >
                        {column.label}
                        {sortBy === column.key ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </button>
                    ) : (
                      <span className="font-medium">{column.label}</span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={totalColSpan}
                  className="h-24 text-center text-muted-foreground"
                >
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={totalColSpan}
                  className="h-24 text-center text-destructive"
                >
                  Terjadi kesalahan memuat data
                </TableCell>
              </TableRow>
            ) : tableData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={totalColSpan}
                  className="h-24 text-center text-muted-foreground"
                >
                  Tidak ada data ditemukan
                </TableCell>
              </TableRow>
            ) : (
              rows(tableData)
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          Menampilkan {tableData.length > 0 ? startRow : 0} sampai {endRow} dari{" "}
          {totalRows} data
        </div>
        <div className="flex items-center gap-1">
          {/* Previous Button */}
          <ShadcnButton
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1 || isLoading || isFetching}
            className="h-10 w-10 sm:h-9 sm:w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </ShadcnButton>

          {/* Page Numbers */}
          {pageNumbers.map((pageNum, index) => {
            if (typeof pageNum === "string") {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="flex items-center justify-center h-10 w-6 sm:h-9 sm:w-9 text-muted-foreground/50"
                >
                  ...
                </div>
              );
            }

            const isActive = pageNum === currentPage;
            return (
              <ShadcnButton
                key={pageNum}
                variant={isActive ? "default" : "outline"}
                size="icon"
                onClick={() => handlePageChange(pageNum)}
                disabled={isLoading || isFetching}
                className={`h-10 w-10 sm:h-9 sm:w-9 ${
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {pageNum}
              </ShadcnButton>
            );
          })}

          {/* Next Button */}
          <ShadcnButton
            variant="outline"
            size="icon"
            onClick={() =>
              handlePageChange(Math.min(currentPage + 1, totalPages))
            }
            disabled={
              currentPage === totalPages ||
              totalPages === 0 ||
              isLoading ||
              isFetching
            }
            className="h-10 w-10 sm:h-9 sm:w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </ShadcnButton>
        </div>
      </div>
    </div>
  );
}

export const DataTable = forwardRef(DataTableComponent) as <
  T extends Record<string, any>
>(
  props: DataTableProps<T> & { ref?: React.Ref<DataTableRef> }
) => ReturnType<typeof DataTableComponent>;
