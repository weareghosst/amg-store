"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
  type AdminActionState,
} from "@/actions/admin";
import { FormMessage, SubmitButton, inputClass, labelClass } from "@/components/forms";

export interface ProductFormDefaults {
  id?: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: string;
  comparePrice: string;
  stock: number;
  categoryId: string;
  imageUrl: string;
  active: boolean;
  weightGrams: number;
  widthCm: number;
  heightCm: number;
  lengthCm: number;
}

export function ProductForm({
  defaults,
  categories,
}: {
  defaults: ProductFormDefaults;
  categories: { id: string; name: string }[];
}) {
  const isEdit = Boolean(defaults.id);
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    isEdit ? updateProductAction : createProductAction,
    {},
  );
  const [deleting, startDeleting] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!defaults.id) return;
    if (!window.confirm("Excluir este produto permanentemente?")) return;
    startDeleting(async () => {
      const result = await deleteProductAction(defaults.id!);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      router.push("/admin/produtos");
    });
  };

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-4">
      {isEdit && <input type="hidden" name="id" value={defaults.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="p-name" className={labelClass}>Nome</label>
          <input id="p-name" name="name" required defaultValue={defaults.name} maxLength={160} className={inputClass} />
        </div>
        <div>
          <label htmlFor="p-slug" className={labelClass}>
            Slug (URL) — ex.: detergente-neutro-5l
          </label>
          <input
            id="p-slug"
            name="slug"
            required
            defaultValue={defaults.slug}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="p-desc" className={labelClass}>Descrição</label>
        <textarea
          id="p-desc"
          name="description"
          rows={5}
          defaultValue={defaults.description}
          maxLength={8000}
          className={inputClass}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor="p-price" className={labelClass}>Preço (R$)</label>
          <input id="p-price" name="price" required defaultValue={defaults.price} placeholder="19,90" inputMode="decimal" className={inputClass} />
        </div>
        <div>
          <label htmlFor="p-compare" className={labelClass}>Preço &quot;de&quot; (opcional)</label>
          <input id="p-compare" name="comparePrice" defaultValue={defaults.comparePrice} placeholder="29,90" inputMode="decimal" className={inputClass} />
        </div>
        <div>
          <label htmlFor="p-stock" className={labelClass}>Estoque</label>
          <input id="p-stock" name="stock" type="number" required min={0} defaultValue={defaults.stock} className={inputClass} />
        </div>
        <div>
          <label htmlFor="p-sku" className={labelClass}>SKU</label>
          <input id="p-sku" name="sku" defaultValue={defaults.sku} maxLength={60} className={inputClass} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="p-cat" className={labelClass}>Categoria</label>
          <select id="p-cat" name="categoryId" defaultValue={defaults.categoryId} className={inputClass}>
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="p-img" className={labelClass}>URL da imagem (https)</label>
          <input id="p-img" name="imageUrl" type="url" defaultValue={defaults.imageUrl} placeholder="https://..." className={inputClass} />
        </div>
      </div>

      <fieldset className="rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-sm font-medium text-slate-500">
          Dados para frete (Melhor Envio)
        </legend>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor="p-weight" className={labelClass}>Peso (g)</label>
            <input id="p-weight" name="weightGrams" type="number" required min={1} defaultValue={defaults.weightGrams} className={inputClass} />
          </div>
          <div>
            <label htmlFor="p-width" className={labelClass}>Largura (cm)</label>
            <input id="p-width" name="widthCm" type="number" required min={1} defaultValue={defaults.widthCm} className={inputClass} />
          </div>
          <div>
            <label htmlFor="p-height" className={labelClass}>Altura (cm)</label>
            <input id="p-height" name="heightCm" type="number" required min={1} defaultValue={defaults.heightCm} className={inputClass} />
          </div>
          <div>
            <label htmlFor="p-length" className={labelClass}>Comprimento (cm)</label>
            <input id="p-length" name="lengthCm" type="number" required min={1} defaultValue={defaults.lengthCm} className={inputClass} />
          </div>
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaults.active}
          className="h-4 w-4 rounded border-slate-300"
        />
        Produto ativo (visível na loja)
      </label>

      <FormMessage error={state.error} success={state.success} />

      <div className="flex gap-3">
        <SubmitButton
          className="rounded-lg bg-brand-blue px-6 py-2.5 font-semibold text-white transition hover:bg-brand-blue-dark disabled:opacity-50"
          pendingText="Salvando..."
        >
          {isEdit ? "Salvar alterações" : "Criar produto"}
        </SubmitButton>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-300 px-4 py-2.5 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </button>
        )}
      </div>
    </form>
  );
}
