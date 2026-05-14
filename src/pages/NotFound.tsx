import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 animate-fade-in">
        <h1 className="text-6xl font-bold gradient-primary bg-clip-text text-transparent">404</h1>
        <p className="text-xl text-muted-foreground">Página não encontrada</p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 gradient-primary text-white rounded-xl hover:shadow-glow transition-slow font-semibold"
        >
          Voltar ao Início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
