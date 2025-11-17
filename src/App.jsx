import { Outlet, NavLink } from "react-router-dom";
import "./App.css";

export default function App() {

  return (
    <div className="app">
      {/* <header className="app__header">
        <NavLink
          to="/vibro"
          className={({ isActive }) =>
            isActive ? "nav-link nav-link--active" : "nav-link"
          }
        >
          <small className="badge">VC</small> сравнение виброизоляционных
          материалов
        </NavLink>
      </header> */}

      <main className="app__main">
        <Outlet />
      </main>

      <footer className="app__footer">
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
