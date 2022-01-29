import { useState, MouseEvent, ChangeEvent } from 'react';
import { SortDirection } from '@mui/material';
import { Button } from './Button';
import { Box, SpanBox } from './Box';
import * as icons from './Icons';
import './DataTable.css';

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

interface DataTableProps<T> {
  rowButtons: any[];
  headCells: HeadCell<T>[];
  onRequestSort: (event: MouseEvent<unknown>, property: keyof T) => void;
  order: Order;
  orderBy: string;
  // rowCount: number;
}

export interface HeadCell<T> {
  disablePadding: boolean;
  id: keyof T;
  label: string;
  numeric: boolean;
  formatter?: (row: T, input: any) => any;
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

function TableSortLabel({
  active,
  direction,
  onClick,
  children,
}: {
  active: boolean;
  direction: SortDirection;
  onClick: any;
  children: any;
}) {
  return (
    <SpanBox className="SpanBox">
      {active ? <icons.UpDownArrow /> : null} {children}
    </SpanBox>
  );
}

function DataTableHead<T>(props: DataTableProps<T>) {
  const { headCells, order, orderBy, onRequestSort, rowButtons = [] } = props;
  const createSortHandler = (property: keyof T) => (event: MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <thead>
      <tr>
        {headCells.map(headCell => (
          <th key={headCell.id.toString()} align={headCell.numeric ? 'right' : 'left'}>
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
            </TableSortLabel>
          </th>
        ))}
        {rowButtons && rowButtons.length ? <th key="buttons">&nbsp;</th> : null}
      </tr>
    </thead>
  );
}

export function TablePagination({
  rowsPerPageOptions,
  count,
  rowsPerPage,
  page,
  onPageChange,
  onRowsPerPageChange,
}: {
  rowsPerPageOptions: number[];
  count: number;
  rowsPerPage: number;
  page: number;
  onPageChange: any;
  onRowsPerPageChange: any;
}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        // '-webkit-box-align': 'center',
        alignItems: 'center',
        paddingLeft: '16px',
        minHeight: '52px',
        paddingRight: '2px',
      }}
    >
      <div
        style={{
          flex: '1 1 100%',
          display: 'block',
        }}
      />
      <p style={{ display: 'block', flexShrink: 0, marginLeft: '10px', marginRight: '10px' }}>Rows per page:</p>
      <div style={{ position: 'relative', display: 'inline-flex', marginLeft: '10px', marginRight: '10px' }}>
        <select name="rows_per_page">
          {rowsPerPageOptions.map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <p
        style={{
          display: 'block',
          flexShrink: 0,
        }}
      >
        {page * rowsPerPage + 1} - {Math.min(count, (page + 1) * rowsPerPage)} of {count}
      </p>
      <div style={{ position: 'relative', display: 'inline-flex', marginLeft: '10px', marginRight: '5px' }}>
        <button type="button">
          <icons.RightLeftArrow />
        </button>
      </div>
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <button type="button">
          <icons.RightLeftArrow flipx />
        </button>
      </div>
    </div>
  );
}

export function DataTable<T>({
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

  return (
    <div>
      <table style={{ width: '100%' }}>
        <DataTableHead
          headCells={headCells}
          order={order}
          orderBy={orderBy.toString()}
          onRequestSort={handleRequestSort}
          rowButtons={rowButtons}
        />
        <tbody>
          {rows
            .slice()
            .sort(getComparator(order, orderBy))
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row, index) => {
              const labelId = `enhanced-table-checkbox-${index}`;
              return (
                <tr tabIndex={-1} key={row[mainColumn].toString()}>
                  {headCells.map(c =>
                    c.id === mainColumn ? (
                      <td key={c.id.toString()} id={labelId}>
                        {c.formatter ? c.formatter(row, row[c.id]) : row[c.id]}
                      </td>
                    ) : (
                      <td key={c.id.toString()} align={c.numeric ? 'right' : 'left'}>
                        {c.formatter ? c.formatter(row, row[c.id]) : row[c.id]}
                      </td>
                    ),
                  )}
                  {rowButtons && rowButtons.length ? (
                    <td key="buttons">
                      {rowButtons.map(b => {
                        const buttonInfo = b(row);

                        return (
                          <Button
                            size="small"
                            color="blue"
                            key={buttonInfo.label}
                            disabled={!buttonInfo.activeCallback(row)}
                            onClick={(event: any) => handleButtonClick(row, buttonInfo.callback)}
                          >
                            {buttonInfo.label}
                          </Button>
                        );
                      })}
                    </td>
                  ) : null}
                </tr>
              );
            })}
        </tbody>
      </table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
}
