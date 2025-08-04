import BottomNav from './BottomNav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-full">
      <main className="flex-grow pb-16 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
