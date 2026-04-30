export function StubPage({ title, sub }: { title: string; sub?: string }) {
  return (
    <>
      <div className="page-h">
        <div>
          <h1>{title}</h1>
          {sub ? <div className="sub">{sub}</div> : null}
        </div>
      </div>
      <div className="stub">
        <div>
          <b>Скоро</b>
          Раздел в разработке. Скажите, что нужно построить здесь — и мы начнём.
        </div>
      </div>
    </>
  );
}
