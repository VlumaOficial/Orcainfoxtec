import logo from '../assets/infoxtec-logo.jpeg'

export default function EmitCard() {
  return (
    <div
      className="flex gap-5 items-start mb-5 p-4 sm:p-5"
      style={{
        background: 'var(--navy3)',
        border: '1px solid var(--border2)',
        borderLeft: '3px solid var(--green)',
        borderRadius: '14px',
      }}
    >
      <img src={logo} alt="Infoxtec" className="h-10 w-auto rounded hidden sm:block" />
      <div>
        <div className="text-[var(--text)] font-bold text-base">
          INFOXTEC TECNOLOGIA E SERVICOS LTDA
        </div>
        <div className="text-[var(--text2)] text-sm">
          CNPJ: 04.309.223/0001-96
        </div>
        <div className="text-[var(--text2)] text-sm">
          Rua Silveira Martins, no 27, Cabula - CEP 41150-000, Salvador/BA
        </div>
      </div>
    </div>
  )
}
