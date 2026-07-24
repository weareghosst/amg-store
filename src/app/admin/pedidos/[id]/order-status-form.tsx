"use client";

import { useActionState } from "react";
import {
  updateOrderStatusAction,
  type AdminActionState,
} from "@/actions/admin";
import { FormMessage, SubmitButton, inputClass, labelClass } from "@/components/forms";

export function OrderStatusForm({
  orderId,
  actions,
  askTracking,
}: {
  orderId: string;
  actions: { status: string; label: string }[];
  askTracking: boolean;
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    updateOrderStatusAction,
    {},
  );

  return (
    <div className="mt-3 flex flex-col gap-3">
      <FormMessage error={state.error} success={state.success} />
      {actions.map((action) => (
        <form key={action.status} action={formAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="status" value={action.status} />
          {askTracking && action.status === "shipped" && (
            <div className="min-w-56">
              <label htmlFor={`tracking-${action.status}`} className={labelClass}>
                Código de rastreio (opcional)
              </label>
              <input
                id={`tracking-${action.status}`}
                name="trackingCode"
                maxLength={60}
                className={inputClass}
              />
            </div>
          )}
          <SubmitButton
            className={
              action.status === "canceled"
                ? "rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                : "rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            }
            pendingText="Aplicando..."
          >
            {action.label}
          </SubmitButton>
        </form>
      ))}
    </div>
  );
}
