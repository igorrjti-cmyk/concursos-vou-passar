"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import Nav from "@/components/Nav";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { MetasConfig } from "@/lib/types";

function Barra({ label, feito, meta }: { label: string; feito: number; meta: number }) {
  const pct = meta > 0 ? Math.min(100, Math.round((feito / meta) * 100)) : 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/60 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink">{label}</span>
        <span className="text-ink-light/60">
          {feito} / {meta}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-ink/10">
        <div
          className={`h-1.5 rounded-full ${pct >= 100 ? "bg-certo" : "bg-gold"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Metas() {
  const [config, setConfig] = useState<MetasConfig | null>(null);
  const [questoesFeitas, setQuestoesFeitas] = useState(0);
  const [revisoesFeitas, setRevisoesFeitas] = useState(0);
  const [minutosFeitos, setMinutosFeitos] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bonusHoje, setBonusHoje] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const supabase = getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setCarregando(false);
      return;
    }

    let { data: cfg } = await supabase
      .from("metas_config")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!cfg) {
      const { data: novo } = await supabase
        .from("metas_config")
        .upsert({ user_id: userId }, { onConflict: "user_id" })
        .select("*")
        .maybeSingle();
      cfg = novo;
    }
    setConfig(cfg as MetasConfig);

    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);

    const { data: tentativasHoje } = await supabase
      .from("tentativas")
      .select("questao_id,tempo_resolucao_seg")
      .eq("user_id", userId)
      .gte("criado_em", inicioHoje.toISOString());

    const lista = tentativasHoje ?? [];
    setQuestoesFeitas(lista.length);
    setMinutosFeitos(
      Math.round(lista.reduce((acc, t) => acc + (t.tempo_resolucao_seg ?? 0), 0) / 60)
    );

    if (lista.length > 0) {
      const idsUnicos = Array.from(new Set(lista.map((t) => t.questao_id)));
      const { data: progressos } = await supabase
        .from("progresso")
        .select("questao_id,tentativas")
        .eq("user_id", userId)
        .in("questao_id", idsUnicos);
      const revisadasIds = new Set(
        (progressos ?? []).filter((p) => p.tentativas > 1).map((p) => p.questao_id)
      );
      setRevisoesFeitas(lista.filter((t) => revisadasIds.has(t.questao_id)).length);
    } else {
      setRevisoesFeitas(0);
    }

    const { data: gam } = await supabase
      .from("gamificacao")
      .select("streak_atual,ultimo_bonus_meta")
      .eq("user_id", userId)
      .maybeSingle();
    setStreak(gam?.streak_atual ?? 0);
    const hojeStr = new Date().toISOString().slice(0, 10);
    setBonusHoje(gam?.ultimo_bonus_meta === hojeStr);

    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (carregando || !config || bonusHoje) return;
    const bateu =
      questoesFeitas >= config.questoes_dia &&
      revisoesFeitas >= config.revisoes_dia &&
      minutosFeitos >= config.minutos_dia;
    if (!bateu) return;
    (async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.rpc("conceder_bonus_meta", {
        p_questoes_feitas: questoesFeitas,
        p_revisoes_feitas: revisoesFeitas,
        p_minutos_feitos: minutosFeitos,
      });
      if (data?.concedido) setBonusHoje(true);
    })();
  }, [carregando, config, questoesFeitas, revisoesFeitas, minutosFeitos, bonusHoje]);

  async function salvarConfig(campo: keyof MetasConfig, valor: number) {
    if (!config) return;
    setSalvando(true);
    const supabase = getSupabaseClient();
    const novo = { ...config, [campo]: valor };
    setConfig(novo);
    await supabase
      .from("metas_config")
      .update({ [campo]: valor })
      .eq("user_id", config.user_id);
    setSalvando(false);
  }

  if (carregando || !config) {
    return (
      <div className="study-page mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-ink-light/60">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="study-page mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Metas diárias</h1>
      <p className="mt-1 text-ink-light/70">
        🔥 {streak} dia(s) seguidos de estudo
        {bonusHoje && <span className="ml-2 text-gold">· +50 XP de hoje já garantido</span>}
      </p>

      <div className="mt-6 space-y-3">
        <Barra label="Questões respondidas" feito={questoesFeitas} meta={config.questoes_dia} />
        <Barra label="Revisões concluídas" feito={revisoesFeitas} meta={config.revisoes_dia} />
        <Barra label="Minutos estudados" feito={minutosFeitos} meta={config.minutos_dia} />
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/60 p-5">
        <h2 className="font-serif text-lg text-ink">Ajustar metas</h2>
        <div className="mt-4 space-y-4">
          <CampoNumero
            label="Questões por dia"
            valor={config.questoes_dia}
            onChange={(v) => salvarConfig("questoes_dia", v)}
            disabled={salvando}
          />
          <CampoNumero
            label="Revisões por dia"
            valor={config.revisoes_dia}
            onChange={(v) => salvarConfig("revisoes_dia", v)}
            disabled={salvando}
          />
          <CampoNumero
            label="Minutos por dia"
            valor={config.minutos_dia}
            onChange={(v) => salvarConfig("minutos_dia", v)}
            disabled={salvando}
          />
        </div>
      </div>
    </div>
  );
}

function CampoNumero({
  label,
  valor,
  onChange,
  disabled,
}: {
  label: string;
  valor: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm text-ink">
      {label}
      <input
        type="number"
        min={1}
        value={valor}
        disabled={disabled}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        className="w-20 rounded-md border border-ink/15 bg-white/70 px-2 py-1 text-right outline-none focus:border-gold"
      />
    </label>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Nav />
      <Metas />
    </AuthGate>
  );
}
