import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import { MobileMenuProvider } from '@/components/shared/MobileMenuContext';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const userRole = (user.user_metadata?.role as string) || 'reception';
  
  const userName = (user.user_metadata?.full_name as string) || 
                   user.email || 
                   'Usuario';

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <MobileMenuProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar userRole={userRole} userName={userName} />

        <div className="lg:pl-64 flex flex-col min-h-screen">
          <Header 
            userName={userName} 
            userRole={userRole} 
            userEmail={user.email || ''} 
          />

          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </MobileMenuProvider>
  );
}
