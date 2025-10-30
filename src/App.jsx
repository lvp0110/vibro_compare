import { Outlet, NavLink } from "react-router-dom";
import "./App.css";

const IMAGE_URL = "http://constrtodo.ru:3005/api/v1/constr/black_back_ground.png";

export default function App() {
  const active = ({ isActive }) => (isActive ? { fontWeight: "700" } : undefined);

  return (
    <div
      style={{
        margin: "0px auto",
        fontFamily: "sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        paddingInline: 16,
        backgroundImage: `url(${IMAGE_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#f7f7f7",
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
          backdropFilter: "blur(30px)",
        }}
      >
        {/* <NavLink to="/" style={active}>
          Material
        </NavLink> */}
        <NavLink to="/vibro" style={active}>
         <small style={{fontSize: 18,padding: 4, border: "solid 1px white", borderRadius: "30%"}}>VC</small> сравнение виброизоляционных материалов
        </NavLink>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
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
        <small>dBase© VibroCompare | </small>
        <small>
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
