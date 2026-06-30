import type { ItemOrcamento } from '../hooks/useItensOrcamento'
import { useState } from 'react'
import { parseBR, fmtBR, clamp99 } from '../lib/numeros'
import type { Produto } from '../hooks/useProdutos'
import type { CSSProperties } from 'react'
import ProdutoCombobox from './ProdutoCombobox'

interface Props {
  itens: ItemOrcamento[]
  onAdicionar: () => void
  onRemover: (id: string) => void
  onAtualizar: (id: string, campo: keyof ItemOrcamento, valor: unknown) => void
  onSelecionarProduto: (id: string, produto: Produto) => void
  onCadastrarNovo: (id: string, nome: string) => void
  onUsarAvulso: (id: string, nome: string) => void
  onEditar: (id: string) => void
  onDesvincular: (id: string) => void
  buscaPorItem: Record<string, string>
  onBuscarItem: (id: string, texto: string) => void
}

// Grade de colunas compartilhada entre cabecalho e linhas.
// Descricao usa minmax(0,1fr) para encolher cedendo espaco aos valores.
const GRID_COLS =
  '28px minmax(0,1fr) 72px 96px 120px 92px 92px 84px 92px 80px 96px 32px'

const chkBoxStyle: CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: '5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  fontSize: '11px',
}

function ChkToggle({ marcado, onToggle, titulo }: { marcado: boolean; onToggle: () => void; titulo: string }) {
  return (
    <div
      onClick={onToggle}
      title={titulo}
      style={{
        ...chkBoxStyle,
        background: marcado ? 'var(--green)' : 'var(--navy4)',
        border: marcado ? '1.5px solid var(--green)' : '1.5px solid var(--border2)',
      }}
    >
      {marcado && <span style={{ color: '#fff' }}>✓</span>}
    </div>
  )
}

function CustoInput({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  const [texto, setTexto] = useState(valor > 0 ? fmtBR(valor) : '')
  const [focado, setFocado] = useState(false)

  if (!focado) {
    const textoEsperado = valor > 0 ? fmtBR(valor) : ''
    if (texto !== textoEsperado) {
      setTexto(textoEsperado)
    }
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          ;(e.target as HTMLInputElement).blur()
        }
      }}
      onFocus={(e) => {
        setFocado(true)
        const v = parseBR(texto)
        const editavel = v > 0 ? v.toString().replace('.', ',') : ''
        setTexto(editavel)
        setTimeout(() => e.target.select(), 0)
      }}
      onBlur={() => {
        setFocado(false)
        const v = parseBR(texto)
        onChange(v)
        setTexto(v > 0 ? fmtBR(v) : '')
      }}
      placeholder="0,00"
      style={{ background: 'var(--navy3)', border: '1px solid transparent', borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--mono)', textAlign: 'right', paddingLeft: '26px' }}
      className="py-1.5 pr-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
    />
  )
}

const cellNum: CSSProperties = {
  textAlign: 'right',
  fontSize: '12px',
  fontFamily: 'var(--mono)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  alignSelf: 'center',
}

const headCell: CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  color: 'var(--text3)',
  whiteSpace: 'nowrap',
  alignSelf: 'end',
  paddingBottom: '6px',
}

export default function ItensTable({
  itens,
  onAdicionar,
  onRemover,
  onAtualizar,
  onSelecionarProduto,
  onCadastrarNovo,
  onUsarAvulso,
  onEditar,
  onDesvincular,
  buscaPorItem,
  onBuscarItem,
}: Props) {
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '880px' }}>
          {/* Cabecalho */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLS,
              gap: '8px',
              borderBottom: '1px solid var(--border2)',
            }}
          >
            <div style={{ ...headCell, textAlign: 'left' }}>#</div>
            <div style={{ ...headCell, textAlign: 'left' }}>Descricao</div>
            <div style={{ ...headCell, textAlign: 'center' }}>Qtd</div>
            <div style={{ ...headCell, textAlign: 'left' }}>Custo Unit.</div>
            <div style={{ ...headCell, textAlign: 'center' }}>Imp-Marg-Desc</div>
            <div style={headCell}>Custo Total</div>
            <div style={headCell}>Preco Tabela</div>
            <div style={headCell}>Desconto</div>
            <div style={headCell}>C/ Imposto</div>
            <div style={headCell}>Lucro</div>
            <div style={headCell}>Total</div>
            <div style={headCell}></div>
          </div>

          {/* Linhas */}
          {itens.map((item, idx) => {
            const custoTotal = item.qtd * item.custoUnit
            const margPct = clamp99(item.usaMargGlobal ? 0 : item.margPct)
            const margemRS = custoTotal * (margPct / 100)
            const baseAntesImposto = custoTotal + margemRS
            const impPct = clamp99(item.usaImpGlobal ? 0 : item.impPct)
            const precoTabela = impPct > 0 ? baseAntesImposto / (1 - impPct / 100) : baseAntesImposto
            let descVal = 0
            if (!item.usaDescGlobal) {
              const descPctClamped = clamp99(item.descPct)
              descVal = item.descFix > 0 ? Math.min(item.descFix, precoTabela) : precoTabela * (descPctClamped / 100)
            }
            const total = precoTabela - descVal
            const comImposto = total * (impPct / 100)
            const lucro = total - comImposto - custoTotal

            return (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID_COLS,
                  gap: '8px',
                  borderBottom: '1px solid var(--border)',
                  padding: '6px 0',
                  alignItems: 'start',
                }}
              >
                {/* # */}
                <div style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text3)', alignSelf: 'center' }}>{idx + 1}</div>

                {/* Descricao - encolhe com minmax(0,1fr) */}
                <div style={{ minWidth: 0 }} title={item.descricao || undefined}>
                  <ProdutoCombobox
                    valorBusca={item.produtoVinculado ? item.produtoVinculado.nome : (buscaPorItem[item.id] ?? item.descricao)}
                    produtoVinculado={item.produtoVinculado}
                    editando={item.produtoEditando}
                    onBuscar={(texto) => {
                      onBuscarItem(item.id, texto)
                      onAtualizar(item.id, 'descricao', texto)
                    }}
                    onSelecionar={(p) => onSelecionarProduto(item.id, p)}
                    onCadastrarNovo={(nome) => onCadastrarNovo(item.id, nome)}
                    onUsarAvulso={(nome) => onUsarAvulso(item.id, nome)}
                    onEditar={() => onEditar(item.id)}
                    onDesvincular={() => onDesvincular(item.id)}
                  />
                </div>

                {/* Qtd */}
                <div className="flex items-center justify-center gap-0.5" style={{ alignSelf: 'center' }}>
                  <button
                    type="button"
                    onClick={() => onAtualizar(item.id, 'qtd', Math.max(0, item.qtd - 1))}
                    style={{ width: '20px', height: '28px', borderRadius: '5px', border: '1px solid var(--border2)', background: 'var(--navy4)', color: 'var(--text2)', flexShrink: 0 }}
                    className="flex items-center justify-center hover:border-[var(--green)] hover:text-[var(--green)]"
                  >-</button>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.qtd}
                    onChange={(e) => onAtualizar(item.id, 'qtd', parseFloat(e.target.value) || 0)}
                    style={{ background: 'var(--navy3)', border: '1px solid transparent', borderRadius: '6px', fontFamily: 'var(--mono)', fontSize: '12px', width: '32px', textAlign: 'center', padding: '6px 2px' }}
                    className="outline-none focus:border-[var(--green)]"
                  />
                  <button
                    type="button"
                    onClick={() => onAtualizar(item.id, 'qtd', item.qtd + 1)}
                    style={{ width: '20px', height: '28px', borderRadius: '5px', border: '1px solid var(--border2)', background: 'var(--navy4)', color: 'var(--text2)', flexShrink: 0 }}
                    className="flex items-center justify-center hover:border-[var(--green)] hover:text-[var(--green)]"
                  >+</button>
                </div>

                {/* Custo Unit */}
                <div style={{ position: 'relative', alignSelf: 'center' }}>
                  <span className="pointer-events-none" style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>R$</span>
                  <CustoInput
                    valor={item.custoUnit}
                    onChange={(v) => onAtualizar(item.id, 'custoUnit', v)}
                  />
                </div>

                {/* Imp - Marg - Desc */}
                <div className="flex flex-col gap-1" style={{ alignSelf: 'center' }}>
                  <div className="flex items-center gap-1">
                    <ChkToggle marcado={item.usaImpGlobal} onToggle={() => onAtualizar(item.id, 'usaImpGlobal', !item.usaImpGlobal)} titulo="Usar imposto global" />
                    <span className="text-[10px] text-[var(--text3)] uppercase">Imp</span>
                    {!item.usaImpGlobal && (
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.impPct || ''}
                        onChange={(e) => onAtualizar(item.id, 'impPct', clamp99(parseFloat(e.target.value) || 0))}
                        placeholder="%"
                        style={{ width: '38px', background: 'var(--navy3)', border: '1px solid transparent', borderRadius: '6px', fontSize: '12px' }}
                        className="px-1 py-1 text-[var(--text)] outline-none focus:border-[var(--green)]"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <ChkToggle marcado={item.usaMargGlobal} onToggle={() => onAtualizar(item.id, 'usaMargGlobal', !item.usaMargGlobal)} titulo="Usar margem global" />
                    <span className="text-[10px] text-[var(--text3)] uppercase">Marg</span>
                    {!item.usaMargGlobal && (
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.margPct || ''}
                        onChange={(e) => onAtualizar(item.id, 'margPct', clamp99(parseFloat(e.target.value) || 0))}
                        placeholder="%"
                        style={{ width: '38px', background: 'var(--navy3)', border: '1px solid transparent', borderRadius: '6px', fontSize: '12px' }}
                        className="px-1 py-1 text-[var(--text)] outline-none focus:border-[var(--green)]"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <ChkToggle marcado={item.usaDescGlobal} onToggle={() => onAtualizar(item.id, 'usaDescGlobal', !item.usaDescGlobal)} titulo="Usar desconto global" />
                    <span className="text-[10px] text-[var(--text3)] uppercase">Desc</span>
                    {!item.usaDescGlobal && (
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.descPct || ''}
                        onChange={(e) => onAtualizar(item.id, 'descPct', clamp99(parseFloat(e.target.value) || 0))}
                        placeholder="%"
                        style={{ width: '38px', background: 'var(--navy3)', border: '1px solid transparent', borderRadius: '6px', fontSize: '12px' }}
                        className="px-1 py-1 text-[var(--text)] outline-none focus:border-[var(--green)]"
                      />
                    )}
                  </div>
                </div>

                {/* Valores calculados */}
                <div style={{ ...cellNum, color: 'var(--text2)' }}>{custoTotal > 0 ? fmtBR(custoTotal) : '\u2014'}</div>
                <div style={{ ...cellNum, color: 'var(--text2)' }}>{custoTotal > 0 ? fmtBR(precoTabela) : '\u2014'}</div>
                <div style={{ ...cellNum, color: 'var(--purple)' }}>{custoTotal > 0 ? fmtBR(descVal) : '\u2014'}</div>
                <div style={{ ...cellNum, color: 'var(--red)' }}>{custoTotal > 0 ? fmtBR(comImposto) : '\u2014'}</div>
                <div style={{ ...cellNum, color: 'var(--amber)' }}>{custoTotal > 0 ? (lucro < 0 ? '- ' + fmtBR(Math.abs(lucro)) : fmtBR(lucro)) : '\u2014'}</div>
                <div style={{ ...cellNum, color: 'var(--green)', fontWeight: 600, fontSize: '13px' }}>{custoTotal > 0 ? fmtBR(total) : '\u2014'}</div>

                {/* Remover */}
                <div style={{ alignSelf: 'center' }}>
                  <button
                    type="button"
                    onClick={() => onRemover(item.id)}
                    className="text-[var(--text3)] hover:text-[var(--red)] hover:bg-[var(--red-dim)] rounded p-1 flex items-center"
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onAdicionar}
        className="mt-3 text-[var(--green)] text-sm flex items-center gap-1.5 hover:underline"
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Adicionar item
      </button>
    </div>
  )
}
