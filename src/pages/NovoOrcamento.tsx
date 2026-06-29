import Layout from '../components/Layout'

export default function NovoOrcamento() {
  return (
    <Layout>
      <div style={{ margin: '-1rem', height: 'calc(100vh - 0px)' }} className="md:-m-8">
        <iframe
          src="/orcamento.html"
          title="Gerador de Orcamento Infoxtec"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'var(--navy)',
            display: 'block',
          }}
        />
      </div>
    </Layout>
  )
}
