import SideNav from "../ui/NavBar";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <SideNav />
      <main className="flex-1 ml-60 p-6 sm:p-8 overflow-y-auto transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
