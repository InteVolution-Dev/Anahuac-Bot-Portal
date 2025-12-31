const Spinner = () =>{
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-orange-500"></div>
        </div>
    )
}

export default Spinner;