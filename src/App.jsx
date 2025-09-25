import { Outlet, NavLink } from "react-router-dom";

export default function App() {
  const active = ({ isActive }) =>
    isActive ? { fontWeight: "700" } : undefined;

  return (
    <div
      style={{
        margin: "0px auto",
        fontFamily: "sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        paddingInline: 16,
      }}
    >
      <header
        style={{
          display: "flex",
          gap: 16,
          padding: "16px 0",
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid #eee",
        }}
      >
        <NavLink to="/" style={active}>
          Material
        </NavLink>
        <NavLink to="/vibro" style={active}>
          Compare
        </NavLink>
        {/* <a href="https://db.acoustic.ru" target="_blank" rel="noreferrer">Docs</a> */}
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "",
          justifyContent: "center",
          padding: "24px 0",
        }}
      >
        <Outlet />
      </main>

      <footer
        style={{
          marginTop: "auto",
          opacity: 0.7,
          padding: "12px 0",
          borderTop: "1px solid #eee",
        }}
      >
        <small>
          AN Game Card ©
          {new Date()
            .toLocaleDateString("ru-RU", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
            .replace(" г.", " г.")
            .replace(/^./, (c) => c.toUpperCase())}
        </small>
      </footer>
    </div>
  );
}
