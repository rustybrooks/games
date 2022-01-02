import { useState, MouseEvent, ChangeEvent } from 'react';
import { visuallyHidden } from '@mui/utils';
import {
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  SortDirection,
} from '@mui/material';

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}
type Order = 'asc' | 'desc';

function getComparator<T>(order: Order, orderBy: keyof T): (a: T, b: T) => number {
  return order === 'desc'
    ? (a: T, b: T) => descendingComparator<T>(a, b, orderBy)
    : (a: T, b: T) => -descendingComparator<T>(a, b, orderBy);
}

export interface HeadCell<T> {
  disablePadding: boolean;
  id: keyof T;
  label: string;
  numeric: boolean;
  formatter?: (row: T, input: any) => any;
}

interface EnhancedTableProps<T> {
  rowButtons: any[];
  headCells: HeadCell<T>[];
  onRequestSort: (event: MouseEvent<unknown>, property: keyof T) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function EnhancedTableHead<T>(props: EnhancedTableProps<T>) {
  const { headCells, order, orderBy, onRequestSort, rowButtons = [] } = props;
  const createSortHandler = (property: keyof T) => (event: MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map(headCell => (
          <TableCell
            key={headCell.id.toString()}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
        {rowButtons && rowButtons.length ? <TableCell key="buttons" /> : null}
      </TableRow>
    </TableHead>
  );
}

interface EnhancedTableToolbarProps {
  loading: boolean;
}

export interface ButtonInfo<T> {
  label: string;
  callback: (row: T) => Promise<void>;
  activeCallback: (row: T) => boolean;
}
type ButtonInfoFn<T> = (row: T) => ButtonInfo<T>;

export interface Props<T> {
  rows: T[];
  headCells: HeadCell<T>[];
  mainColumn: keyof T;
  initialSortColumn: keyof T;
  initialSortOrder?: Order;
  rowButtons: ButtonInfoFn<T>[];
  initialRowsPerPage?: number;
  minWidth?: number | string;
  selectedRows?: any[];
}

// eslint-disable-next-line import/no-default-export
export function EnhancedTable<T>({
  rows,
  headCells,
  mainColumn,
  initialSortColumn,
  initialSortOrder = 'asc',
  rowButtons = null,
  initialRowsPerPage = 10,
  minWidth = 600,
  selectedRows = [],
}: Props<T>) {
  const [order, setOrder] = useState<Order>(initialSortOrder);
  const [orderBy, setOrderBy] = useState<keyof T>(initialSortColumn);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const handleRequestSort = (event: MouseEvent<unknown>, property: keyof T) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleButtonClick = (row: T, fn: (row: T) => Promise<void>) => {
    fn(row);
  };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  return (
    <Box sx={{ width: '100%' }}>
      <TableContainer>
        <Table sx={{ minWidth: minWidth }} aria-labelledby="tableTitle" size="small">
          <EnhancedTableHead
            headCells={headCells}
            order={order}
            orderBy={orderBy.toString()}
            onRequestSort={handleRequestSort}
            rowCount={rows.length}
            rowButtons={rowButtons}
          />
          <TableBody>
            {rows
              .slice()
              .sort(getComparator(order, orderBy))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    selected={selectedRows.includes(row[mainColumn])}
                    role="checkbox"
                    tabIndex={-1}
                    key={row[mainColumn].toString()}
                  >
                    {headCells.map(c =>
                      c.id === mainColumn ? (
                        <TableCell key={c.id.toString()} component="th" id={labelId} scope={'row'} padding={'none'}>
                          {c.formatter ? c.formatter(row, row[c.id]) : row[c.id]}
                        </TableCell>
                      ) : (
                        <TableCell key={c.id.toString()} align={c.numeric ? 'right' : 'left'}>
                          {c.formatter ? c.formatter(row, row[c.id]) : row[c.id]}
                        </TableCell>
                      ),
                    )}
                    {rowButtons && rowButtons.length ? (
                      <TableCell size="small" key="buttons">
                        {rowButtons.map(b => {
                          const buttonInfo = b(row);

                          return (
                            <Button
                              size="small"
                              sx={{ margin: '3x' }}
                              key={buttonInfo.label}
                              disabled={!buttonInfo.activeCallback(row)}
                              variant={'contained'}
                              onClick={event => handleButtonClick(row, buttonInfo.callback)}
                            >
                              {buttonInfo.label}
                            </Button>
                          );
                        })}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            {emptyRows > 0 && (
              <TableRow
                style={{
                  height: 33 * emptyRows,
                }}
              >
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
}
