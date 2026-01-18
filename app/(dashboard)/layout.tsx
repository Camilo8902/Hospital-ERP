import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';

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

  // Obtener el rol directamente de los metadatos del usuario
  const userRole = (user.raw_user_meta_data?.role as string) || 
                   (user.user_metadata?.role as string) || 
                   'reception';
  
  const userName = (user.raw_user_meta_data?.full_name as string) || 
                   (user.user_metadata?.full_name as string) || 
                   user.email || 
                   'Usuario';

  // Obtener perfil de la tabla (para datos adicionales)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole={userRole} userName={userName} />

      <div className="lg:pl-64">
        <Header 
          userName={userName} 
          userRole={userRole} 
          userEmail={user.email || ''} 
        />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
