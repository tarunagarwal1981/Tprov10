import * as React from "react"
import { FiChevronUp, FiChevronDown, FiMoreVertical } from "react-icons/fi"
import { cva, type VariantProps } from "class-variance-authority"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"

import { cn } from "@/lib/utils"

const tableVariants = cva(
  "w-full caption-bottom text-sm",
  {
    variants: {
      variant: {
        default: "",
        striped: "[&_tbody_tr:nth-child(even)]:bg-muted/30",
        bordered: "border border-border",
        hoverable: "[&_tbody_tr]:hover:bg-muted/50",
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface TableProps
  extends React.HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {
  loading?: boolean
  empty?: boolean
  emptyState?: React.ReactNode
  stickyHeader?: boolean
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant, size, loading = false, empty = false, emptyState, stickyHeader = false, children, ...props }, ref) => {
    if (loading) {
      return (
        <div className="relative w-full overflow-auto">
          <table ref={ref} className={cn(tableVariants({ variant, size, className }))} {...props}>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
        </div>
      )
    }

    if (empty && emptyState) {
      return (
        <div className="relative w-full overflow-auto">
          <div className="flex items-center justify-center py-8">
            {emptyState}
          </div>
        </div>
      )
    }

    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={cn(
            tableVariants({ variant, size, className }),
            stickyHeader && "sticky-header"
          )}
          {...props}
        >
          {children}
        </table>
      </div>
    )
  }
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b bg-muted/50", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

export interface TableRowProps
  extends Omit<React.HTMLAttributes<HTMLTableRowElement>, 'onSelect'> {
  selected?: boolean
  selectable?: boolean
  onSelect?: (selected: boolean) => void
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected = false, selectable = false, onSelect, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-all duration-150 hover:bg-muted/50 data-[state=selected]:bg-muted",
        selected && "bg-muted/30",
        className
      )}
      data-state={selected ? "selected" : undefined}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean
  sortDirection?: "asc" | "desc" | null
  onSort?: () => void
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, sortable = false, sortDirection, onSort, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        sortable && "cursor-pointer hover:bg-muted/50 transition-colors",
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
          >
            {sortDirection === "asc" ? (
              <FiChevronUp className="h-3 w-3" />
            ) : sortDirection === "desc" ? (
              <FiChevronDown className="h-3 w-3" />
            ) : (
              <FiMoreVertical className="h-3 w-3 opacity-50" />
            )}
          </Button>
        )}
      </div>
    </th>
  )
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// Selection components
export interface TableSelectAllProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const TableSelectAll = React.forwardRef<
  HTMLButtonElement,
  TableSelectAllProps
>(({ checked = false, onCheckedChange, ...props }, ref) => (
  <Checkbox
    ref={ref}
    checked={checked}
    onCheckedChange={onCheckedChange}
    {...props}
  />
))
TableSelectAll.displayName = "TableSelectAll"

export interface TableSelectRowProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const TableSelectRow = React.forwardRef<
  HTMLButtonElement,
  TableSelectRowProps
>(({ checked = false, onCheckedChange, ...props }, ref) => (
  <Checkbox
    ref={ref}
    checked={checked}
    onCheckedChange={onCheckedChange}
    {...props}
  />
))
TableSelectRow.displayName = "TableSelectRow"

// Pagination component
export interface TablePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  totalItems?: number
  showPageSizeSelector?: boolean
}

const TablePagination = React.forwardRef<
  HTMLDivElement,
  TablePaginationProps
>(({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  pageSize, 
  onPageSizeChange, 
  totalItems,
  showPageSizeSelector = false,
  ...props 
}, ref) => {
  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <div ref={ref} className="flex items-center justify-between px-2 py-4" {...props}>
      <div className="flex items-center gap-2">
        {showPageSizeSelector && pageSize && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded border border-input bg-background px-2 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
        {totalItems && (
          <span className="text-sm text-muted-foreground">
            {totalItems} total items
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="px-2 text-sm text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
})
TablePagination.displayName = "TablePagination"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableSelectAll,
  TableSelectRow,
  TablePagination,
  tableVariants,
}
