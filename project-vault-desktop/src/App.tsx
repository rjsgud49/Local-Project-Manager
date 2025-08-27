import Home from "./pages/Home";

export default function App() {
  return (
    <div>
      <header className="topbar">
        <div className="brand">Project Vault (Desktop)</div>
      </header>
      <Home />
      <footer className="footer">© {new Date().getFullYear()} Project Vault</footer>
    </div>
  );
}
