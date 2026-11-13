import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2, Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import TableSkeleton from '@/components/common/TableSkeleton';
import Pagination from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ExpenseFormDialog from '@/components/expenses/ExpensesFormDialog';
import { useCursorPager } from '@/hooks/useCursorPager';
import { useSettings } from '@/hooks/useSettings';
import {
  EXPENSE_CATEGORIES,
  createExpense,
  deleteExpense,
  expensesTotals,
  listExpenses,
  updateExpense,
} from '@/services/expenses';
import { formatDate, formatCurrency, formatNumber } from '@/lib/format';

const PAGE_SIZE = 20;

function monthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

export default function Expenses() {
  const { settings } = useSettings();
  const currency = settings.currency || 'GHS';
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pager = useCursorPager();

  const [period, setPeriod] = useState('month');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const range = useMemo(() => {
    if (period === 'all') return { from: null, to: null };
    if (period === 'month') return monthRange();
    const days = period === '30d' ? 30 : 7;
    const now = new Date();
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { from, to: now.toISOString().slice(0, 10) };
  }, [period]);

  const filters = useMemo(() => ({ search, category, from: range.from, to: range.to }), [search, category, range.from, range.to]);

  const expensesQuery = useQuery({
    queryKey: ['expenses', filters, pager.cursor],
    queryFn: () => listExpenses({ ...filters, limit: PAGE_SIZE, cursor: pager.cursor }),
  });

  const totalsQuery = useQuery({
    queryKey: ['expenses-total', range.from, range.to],
    queryFn: () => expensesTotals({ from: range.from, to: range.to }),
  });

  const expenses = expensesQuery.data?.items ?? [];
  const totals = totalsQuery.data;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['expenses-total'] });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
  };

  const saveMutation = useMutation({
    mutationFn: ({ record, values }) => (record ? updateExpense(record.id, values) : createExpense(values)),
    onSuccess: (_, variables) => {
      invalidate();
      toast({ title: variables.record ? 'Expense updated' : 'Expense recorded', description: `${variables.values.title} was saved.` });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (record) => deleteExpense(record.id),
    onSuccess: (_, record) => {
      invalidate();
      toast({ title: 'Expense deleted', description: `${record.title} was removed.` });
      setDeleteTarget(null);
      setEditing(null);
    },
  });

  const applyFilter = (setter) => (value) => {
    setter(value);
    pager.reset();
  };

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Expenses"
        description="Money leaving the business — rent, transport, wages, packaging. Recorded separately from stock purchases."
        actions={
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Record expense
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Expenses in period"
          value={totals ? formatCurrency(totals.total, currency) : '—'}
          hint={`${period === 'all' ? 'All recorded expenses' : period === 'month' ? 'This month' : `Last ${period === '30d' ? 30 : 7} days`}`}
          icon={Wallet}
        />
        <StatCard label="Entries" value={totals ? formatNumber(totals.count) : '—'} hint="In the selected period" />
        <StatCard
          label="Largest category"
          value={category === 'all' ? '—' : category}
          hint="Filtered view — clear the category filter to see everything"
        />
      </div>

      <div className="surface mb-5 grid gap-3 p-3.5 lg:grid-cols-[190px_200px_minmax(0,1fr)]">
        <Select value={period} onValueChange={applyFilter(setPeriod)}>
          <SelectTrigger className="h-10" aria-label="Period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={applyFilter(setCategory)}>
          <SelectTrigger className="h-10" aria-label="Category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {EXPENSE_CATEGORIES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => applyFilter(setSearch)(event.target.value)}
            placeholder="Search expenses"
            className="h-10 pl-9 pr-9"
            aria-label="Search expenses"
          />
          {search && (
            <button
              type="button"
              onClick={() => applyFilter(setSearch)('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {expensesQuery.isLoading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : expensesQuery.isError ? (
        <ErrorState title="Expenses could not be loaded" error={expensesQuery.error} onRetry={() => expensesQuery.refetch()} />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No expenses recorded here"
          description="Record rent, transport, wages or any other cost so the profit figures on your reports mean something."
          action={
            <Button className="gap-2" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Record expense
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="surface overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Date</TableHead>
                  <TableHead>Expense</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Paid with</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="whitespace-nowrap text-[12px] text-muted-foreground">
                      {formatDate(expense.expense_date, 'd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <span className="text-[13px] font-medium">{expense.title}</span>
                      {expense.notes && <span className="block text-[11px] text-muted-foreground">{expense.notes}</span>}
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{expense.category || '—'}</TableCell>
                    <TableCell className="text-[13px] capitalize text-muted-foreground">
                      {(expense.payment_method || '').replace('_', ' ') || '—'}
                    </TableCell>
                    <TableCell className="tnum text-right text-[13px] font-semibold">
                      {formatCurrency(expense.amount, currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(expense)} aria-label={`Edit ${expense.title}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(expense)}
                          aria-label={`Delete ${expense.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="surface">
            <Pagination
              page={pager.page}
              canGoPrev={pager.canGoPrev}
              canGoNext={Boolean(expensesQuery.data?.has_more)}
              onPrev={pager.goPrev}
              onNext={() => pager.goNext(expensesQuery.data?.next_cursor)}
              total={expenses.length}
              totalLabel="expenses"
            />
          </div>
        </div>
      )}

      {(creating || editing) && (
        <ExpenseFormDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setCreating(false);
              setEditing(null);
            }
          }}
          expense={editing}
          currency={currency}
          onSubmit={(values) => saveMutation.mutateAsync({ record: editing, values })}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this expense?"
        description={`${deleteTarget?.title} will be removed from the records and from your expense totals.`}
        confirmLabel="Delete expense"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </div>
  );
}
