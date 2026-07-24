"use client";

import { useActionState, useState, useTransition } from "react";
import {
  deleteCategoryAction,
  saveCategoryAction,
  type AdminActionState,
} from "@/actions/admin";
import { FormMessage, SubmitButton, inputClass, labelClass } from "@/components/forms";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  position: number;
}

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    saveCategoryAction,
    {},
  );
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [deleting, startDeleting] = useTransition();

  const handleDelete = (category: CategoryRow) => {
    if (
      !window.confirm(
        `Excluir a categoria "${category.name}"? Os produtos dela ficarão sem categoria.`,
      )
    )
      return;
    startDeleting(async () => {
      const result = await deleteCategoryAction(category.id);
      if (result.error) window.alert(result.error);
    });
  };

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Ordem</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma categoria.
                </td>
              </tr>
            )}
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-slate-500">{c.slug}</td>
                <td className="px-4 py-3">{c.position}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    className="mr-3 text-xs font-medium text-brand-blue hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => handleDelete(c)}
                    className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        action={formAction}
        key={editing?.id ?? "new"}
        className="h-fit rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2 className="font-bold text-slate-800">
          {editing ? `Editar: ${editing.name}` : "Nova categoria"}
        </h2>
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label htmlFor="c-name" className={labelClass}>Nome</label>
            <input id="c-name" name="name" required defaultValue={editing?.name ?? ""} maxLength={80} className={inputClass} />
          </div>
          <div>
            <label htmlFor="c-slug" className={labelClass}>Slug — ex.: produtos-de-limpeza</label>
            <input
              id="c-slug"
              name="slug"
              required
              defaultValue={editing?.slug ?? ""}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="c-pos" className={labelClass}>Ordem de exibição</label>
            <input id="c-pos" name="position" type="number" min={0} defaultValue={editing?.position ?? 0} className={inputClass} />
          </div>
          <FormMessage error={state.error} success={state.success} />
          <div className="flex gap-2">
            <SubmitButton pendingText="Salvando...">
              {editing ? "Salvar" : "Criar categoria"}
            </SubmitButton>
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
