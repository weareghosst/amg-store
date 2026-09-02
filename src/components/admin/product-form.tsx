"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
  type AdminActionState,
} from "@/actions/admin";
import { FormMessage, SubmitButton, inputClass, labelClass } from "@/components/forms";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

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
  const [imageData, setImageData] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileChange(file: File | undefined) {
    setUploadError("");
    if (!file) return;
    if (/^image\/(png|jpe?g|webp)$/i.test(file.type) === false) {
      setUploadError("Formato inválido: use PNG, JPG ou WebP.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError("Imagem muito grande (máx. 2MB).");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(String(reader.result ?? ""));
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.onerror = () => {
      setUploadError("Não foi possível ler a imagem.");
    };
    reader.readAsDataURL(file);
  }

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
        <div className="space-y-2">
          <span className={labelClass}>Imagem do produto</span>
          {imageData && (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageData} alt="Pré-visualização" className="h-32 w-full object-cover" />
            </div>
          )}
          <label className="block cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-center text-sm text-slate-500 transition hover:border-brand-blue hover:text-brand-blue">
            {imageData
              ? "Trocar imagem enviada"
              : "Enviar imagem do computador (PNG, JPG ou WebP — máx. 2MB)"}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? undefined)}
            />
          </label>
          {uploadError && (
            <p className="text-xs text-red-600">{uploadError}</p>
          )}
          <hr className="border-slate-100" />
          <input
            id="p-img-url"
            name="imageUrl"
            type="text"
            defaultValue={imageData ? "" : defaults.imageUrl}
            placeholder="ou cole o link https://..."
            disabled={Boolean(imageData)}
            className={inputClass}
          />
          {Boolean(imageData) && (
            <button
              type="button"
              onClick={() => setImageData("")}
              className="text-xs font-medium text-red-500 hover:underline"
            >
              Remover imagem enviada e usar link
            </button>
          )}
          {imageData && <input type="hidden" name="imageUpload" value={imageData} />}
        </div>
      </div>

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
