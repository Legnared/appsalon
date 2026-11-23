export default function MainLayout({ children }) {
    return (
        <div className="contenedor-app">
            <div className="imagen"></div>
            <div className="app">{children}</div>
        </div>
    );
}
