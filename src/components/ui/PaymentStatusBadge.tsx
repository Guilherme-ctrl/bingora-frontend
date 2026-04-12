import type { PaymentStatus } from '@/types/api';

const label: Record<PaymentStatus, string> = {
  paid: 'Pago',
  unpaid: 'Não pago',
};

const cls: Record<PaymentStatus, string> = {
  paid: 'badge--completed',
  unpaid: 'badge--draft',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`badge ${cls[status]}`}>{label[status]}</span>
  );
}
