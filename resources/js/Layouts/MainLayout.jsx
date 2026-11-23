export default function MainLayout({ children }) {
    return (
        <div className="contenedor-app">
            <div className="imagen">
                <picture>
                    <source srcSet="/img/1.webp" type="image/webp" />
                    <img src="/img/1.jpg" alt="App Salón Barbería" />
                </picture>
            </div>
            <div className="app">{children}</div>
        </div>
    );
}
