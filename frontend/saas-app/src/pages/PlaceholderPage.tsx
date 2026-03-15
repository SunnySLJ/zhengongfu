interface Props {
  title: string
}

export default function PlaceholderPage({ title }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: '#bfbfbf',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: '#8c8c8c' }}>{title}</div>
      <div style={{ fontSize: 13, marginTop: 8 }}>即将上线</div>
    </div>
  )
}
