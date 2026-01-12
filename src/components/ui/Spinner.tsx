const Spinner = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500/30 border-t-orange-500" />
      <p className="text-sm text-orange-400 animate-pulse">
        Cargando...
      </p>
    </div>
  );
};

export default Spinner;
