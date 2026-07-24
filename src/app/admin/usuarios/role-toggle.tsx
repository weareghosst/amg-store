"use client";

import { useTransition } from "react";
import { toggleUserRoleAction } from "@/actions/admin";

export function RoleToggle({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const message = isAdmin
      ? "Remover o acesso de administrador deste usuário?"
      : "Conceder acesso TOTAL de administrador a este usuário?";
    if (!window.confirm(message)) return;
    startTransition(async () => {
      const result = await toggleUserRoleAction(userId);
      if (result.error) window.alert(result.error);
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="text-xs font-medium text-brand-blue hover:underline disabled:opacity-50"
    >
      {pending ? "Aplicando..." : isAdmin ? "Rebaixar para cliente" : "Tornar admin"}
    </button>
  );
}
